import express from 'express'
import cors from 'cors'
import { groth16 } from 'snarkjs'
import { buildPoseidon } from 'circomlibjs'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const app = express()
app.use(cors())
app.use(express.json())

app.post('/generate-proof', async (req, res) => {
  try {
    const { co2, biomass, area } = req.body
    console.log('Generating proof for:', { co2, biomass, area })

    // Compute commitment
    const poseidon = await buildPoseidon()
    const hash = poseidon([BigInt(co2), BigInt(biomass), BigInt(area)])
    const commitment = poseidon.F.toString(hash)

    // Generate proof
    const input = {
      co2_reading: co2,
      biomass_density: biomass,
      area_ha: area,
      co2_threshold: '1000',
      biomass_threshold: '70',
      area_threshold: '100',
      commitment
    }

    const wasmPath = resolve('../circuits/build/mrv_verifier_js/mrv_verifier.wasm')
    const zkeyPath = resolve('../circuits/build/mrv_verifier_final.zkey')

    const { proof, publicSignals } = await groth16.fullProve(input, wasmPath, zkeyPath)
    console.log('Proof generated!')

    res.json({ proof, publicSignals })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

app.listen(3001, () => console.log('Proof server running on port 3001'))