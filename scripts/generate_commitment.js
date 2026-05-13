const { buildPoseidon } = require("circomlibjs");

async function main() {
    const poseidon = await buildPoseidon();
    
    // Invalid test values
    const co2 = BigInt(500);   // below threshold
    const biomass = BigInt(85);
    const area = BigInt(500);
    
    const hash = poseidon([co2, biomass, area]);
    const commitment = poseidon.F.toString(hash);
    
    console.log("Commitment:", commitment);
}

main();