import { useState } from 'react'
import { ethers } from 'ethers'
import './App.css'

const CARBON_CREDIT_ADDRESS = '0xa6ea0CC29B0938f8caBD0fD8e87b3e86c4F14951'

const CARBON_CREDIT_ABI = [
  'function verifyAndMint(uint[2] _pA, uint[2][2] _pB, uint[2] _pC, uint[4] _pubSignals, uint256 amount) external',
  'function retireCredit(uint256 amount, bytes32 nullifier) external',
  'function creditBalance(address) view returns (uint256)',
]

type Step = 'idle' | 'connecting' | 'generating' | 'minting' | 'done' | 'error'

export default function App() {
  const [co2, setCo2] = useState('1250')
  const [biomass, setBiomass] = useState('85')
  const [area, setArea] = useState('500')
  const [step, setStep] = useState<Step>('idle')
  const [log, setLog] = useState<string[]>([])
  const [txHash, setTxHash] = useState('')
  const [balance, setBalance] = useState('')
  const [wallet, setWallet] = useState<ethers.Signer | null>(null)
  const [address, setAddress] = useState('')

  const addLog = (msg: string) => setLog(prev => [...prev, msg])

  async function connectWallet() {
    try {
      setStep('connecting')
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      await provider.send('eth_requestAccounts', [])
      try {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x128',
            chainName: 'Hedera Testnet',
            nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
            rpcUrls: ['https://testnet.hashio.io/api'],
            blockExplorerUrls: ['https://hashscan.io/testnet']
          }]
        })
      } catch (_) {}
      const signer = await provider.getSigner()
      const addr = await signer.getAddress()
      setWallet(signer)
      setAddress(addr)
      addLog('✅ Wallet connected: ' + addr)
      setStep('idle')
    } catch (e: any) {
      addLog('❌ ' + e.message)
      setStep('error')
    }
  }

  async function generateAndMint() {
    if (!wallet) { addLog('Connect wallet first!'); return }
    try {
      setStep('generating')
      setLog([])
      addLog('🔐 Generating ZK proof...')
      const response = await fetch('http://localhost:3001/generate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ co2, biomass, area })
      })
      const { proof, publicSignals } = await response.json()
      addLog('✅ ZK proof generated!')
      addLog('📡 Submitting to Hedera testnet...')
      setStep('minting')
      const contract = new ethers.Contract(CARBON_CREDIT_ADDRESS, CARBON_CREDIT_ABI, wallet)
      const pA = [proof.pi_a[0], proof.pi_a[1]]
      const pB = [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]]
      ]
      const pC = [proof.pi_c[0], proof.pi_c[1]]
      const pubSignals = publicSignals.slice(0, 4)
      const tx = await contract.verifyAndMint(pA, pB, pC, pubSignals, 1)
      addLog('⏳ Waiting for confirmation...')
      await tx.wait()
      setTxHash(tx.hash)
      addLog('✅ Carbon credit minted! TX: ' + tx.hash)
      const bal = await contract.creditBalance(address)
      setBalance(bal.toString())
      addLog('💚 Balance: ' + bal.toString() + ' credits')
      setStep('done')
    } catch (e: any) {
      addLog('❌ ' + e.message)
      setStep('error')
    }
  }

  async function retire() {
    if (!wallet) return
    try {
      addLog('🔥 Retiring credit...')
      const contract = new ethers.Contract(CARBON_CREDIT_ADDRESS, CARBON_CREDIT_ABI, wallet)
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes(address + Date.now().toString()))
      const tx = await contract.retireCredit(1, nullifier)
      await tx.wait()
      addLog('✅ Credit retired! Nullifier stored on-chain.')
      const bal = await contract.creditBalance(address)
      setBalance(bal.toString())
    } catch (e: any) {
      addLog('❌ ' + e.message)
    }
  }

  const hashscanUrl = 'https://hashscan.io/testnet/tx/' + txHash

  return (
    <div className="app">
      <div className="bg-gradient" />
      <header>
        <div className="logo">⬡ ZKCarb</div>
        <div className="tagline">Privacy-Preserving Carbon Credits on Hedera</div>
        {address && <div className="address-badge">{address.slice(0,6)}...{address.slice(-4)}</div>}
      </header>

      <main>
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-label">Network</span>
            <span className="stat-value green">Hedera Testnet</span>
          </div>
          <div className="stat">
            <span className="stat-label">Proof System</span>
            <span className="stat-value">Groth16</span>
          </div>
          <div className="stat">
            <span className="stat-label">Credits Balance</span>
            <span className="stat-value green">{balance || '0'}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Contract</span>
            <span className="stat-value purple">{CARBON_CREDIT_ADDRESS.slice(0,8)}...</span>
          </div>
        </div>

        <div className="grid">
          <div className="card">
            <div className="card-header">
              <span className="card-icon">🌿</span>
              <h2>MRV Data Input</h2>
              <span className="badge">Private</span>
            </div>
            <p className="card-desc">Your sensor data never leaves your device. Only a ZK proof is submitted on-chain.</p>
            <div className="input-group">
              <label>CO₂ Sequestration (kg/ha/year)</label>
              <input value={co2} onChange={e => setCo2(e.target.value)} placeholder="e.g. 1250" />
              <span className="threshold">Threshold: ≥ 1000</span>
            </div>
            <div className="input-group">
              <label>Biomass Density (tonnes/ha)</label>
              <input value={biomass} onChange={e => setBiomass(e.target.value)} placeholder="e.g. 85" />
              <span className="threshold">Threshold: ≥ 70</span>
            </div>
            <div className="input-group">
              <label>Project Area (hectares)</label>
              <input value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. 500" />
              <span className="threshold">Threshold: ≥ 100</span>
            </div>
            {!wallet ? (
              <button className="btn btn-primary" onClick={connectWallet}>
                🔗 Connect MetaMask
              </button>
            ) : (
              <button
                className={'btn btn-primary' + (step === 'generating' || step === 'minting' ? ' loading' : '')}
                onClick={generateAndMint}
                disabled={step === 'generating' || step === 'minting'}
              >
                {step === 'generating' ? '⏳ Generating Proof...' :
                 step === 'minting' ? '⛓️ Minting...' :
                 '🔐 Generate Proof & Mint Credit'}
              </button>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-icon">📋</span>
              <h2>Transaction Log</h2>
              {step === 'done' && <span className="badge green">Complete</span>}
            </div>
            <div className="log-box">
              {log.length === 0 && <p className="log-empty">Logs will appear here...</p>}
              {log.map((l, i) => <div key={i} className="log-line">{l}</div>)}
            </div>
            {txHash && (
              <a href={hashscanUrl} target="_blank" rel="noreferrer" className="tx-link">
                🔍 View on HashScan ↗
              </a>
            )}
            {balance && parseInt(balance) > 0 && (
              <button className="btn btn-danger" onClick={retire}>
                🔥 Retire Credit (Test Double-Spend Prevention)
              </button>
            )}
          </div>
        </div>

        <div className="how-it-works">
          <h3>How ZKCarb Works</h3>
          <div className="steps">
            <div className="step-item">
              <div className="step-num">1</div>
              <div className="step-text"><strong>Private Input</strong><br/>MRV sensor data stays on your device</div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-num">2</div>
              <div className="step-text"><strong>ZK Proof</strong><br/>Groth16 proves data meets thresholds</div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-num">3</div>
              <div className="step-text"><strong>On-Chain Verify</strong><br/>Hedera verifies proof, mints credit</div>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-num">4</div>
              <div className="step-text"><strong>Retire</strong><br/>Nullifier prevents double-counting</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}