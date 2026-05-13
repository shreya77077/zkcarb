pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template MRVVerifier() {
    // ── Private inputs (never revealed) ──
    signal input co2_reading;
    signal input biomass_density;
    signal input area_ha;

    // ── Public inputs (known to verifier) ──
    signal input co2_threshold;
    signal input biomass_threshold;
    signal input area_threshold;
    signal input commitment;

    // ── Threshold constraints ──
    // n=64 prevents field-wrap silent failures
    component c1 = GreaterEqThan(64);
    c1.in[0] <== co2_reading;
    c1.in[1] <== co2_threshold;
    c1.out === 1;

    component c2 = GreaterEqThan(64);
    c2.in[0] <== biomass_density;
    c2.in[1] <== biomass_threshold;
    c2.out === 1;

    component c3 = GreaterEqThan(64);
    c3.in[0] <== area_ha;
    c3.in[1] <== area_threshold;
    c3.out === 1;

    // ── Poseidon commitment ──
    component h = Poseidon(3);
    h.inputs[0] <== co2_reading;
    h.inputs[1] <== biomass_density;
    h.inputs[2] <== area_ha;
    commitment === h.out;
}

component main {
    public [co2_threshold, biomass_threshold, area_threshold, commitment]
} = MRVVerifier();