const snarkjs = require("snarkjs");
const { buildPoseidon } = require("circomlibjs");
const fs = require("fs");

async function main() {
    // ── Step 1: Compute Poseidon commitment ──
    const poseidon = await buildPoseidon();

    const co2      = BigInt(1250);
    const biomass  = BigInt(85);
    const area     = BigInt(500);

    const hash = poseidon([co2, biomass, area]);
    const commitment = poseidon.F.toString(hash);
    console.log("Commitment:", commitment);

    // ── Step 2: Build input ──
    const input = {
        co2_reading:        co2.toString(),
        biomass_density:    biomass.toString(),
        area_ha:            area.toString(),
        co2_threshold:      "1000",
        biomass_threshold:  "70",
        area_threshold:     "100",
        commitment:         commitment
    };

    // ── Step 3: Generate proof ──
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        "circuits/build/mrv_verifier_js/mrv_verifier.wasm",
        "circuits/build/mrv_verifier_final.zkey"
    );

    console.log("Proof generated!");
    console.log("Public signals:", publicSignals);

    // ── Step 4: Verify proof ──
    const vkey = JSON.parse(fs.readFileSync("circuits/build/verification_key.json"));
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);

    console.log("Proof valid:", isValid);

    // ── Step 5: Save proof and public signals ──
    fs.writeFileSync("circuits/build/proof.json", JSON.stringify(proof, null, 2));
    fs.writeFileSync("circuits/build/public.json", JSON.stringify(publicSignals, null, 2));
    console.log("Saved proof.json and public.json");
}

main().catch(console.error);