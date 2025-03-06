import { BEAM_PROPERTIES } from './beamData.js';

export class BeamCalculator {
    static YOUNG_MODULUS = 210000;  // Young's Modulus for mild steel (N/mm²)

    static calculate(beamType, beamSize, length, force, units) {
        // Convert inputs to base units (mm and N)
        let lengthMM = length;
        switch(units.length_unit) {
            case 'm': lengthMM = length * 1000; break;
            case 'cm': lengthMM = length * 10; break;
        }

        let forceN = force;
        switch(units.force_unit) {
            case 'kN': forceN = force * 1000; break;
            case 'kg': forceN = force * 9.81; break;
        }

        const beam = BEAM_PROPERTIES[beamType][beamSize];
        const I = beam.I || beam.I_major;
        const Z = beam.Z || beam.Z_major;
        
        const moment = forceN * lengthMM / 4;
        let stress = moment / Z;
        let deflection = (forceN * Math.pow(lengthMM, 3)) / (48 * this.YOUNG_MODULUS * I);
        
        // Convert outputs to selected units
        switch(units.stress_unit) {
            case 'MPa': break; // Same as N/mm²
            case 'kPa': stress *= 1000; break;
        }

        switch(units.deflection_unit) {
            case 'cm': deflection /= 10; break;
            case 'm': deflection /= 1000; break;
        }

        // Calculate utilization (always using base units N/mm²)
        const baseStress = moment / Z;  // Calculate stress in N/mm² for utilization
        const allowable_stress = 275;
        const stress_utilization = (baseStress / allowable_stress) * 100;
        
        const span_ratio = lengthMM / (deflection * (units.deflection_unit === 'm' ? 1000 : units.deflection_unit === 'cm' ? 10 : 1));

        return {
            stress: stress.toFixed(2),
            deflection: deflection.toFixed(2),
            properties: beam,
            utilization: stress_utilization.toFixed(2),
            span_ratio: span_ratio.toFixed(2),
            steps: this.generateSteps(beamType, beamSize, lengthMM, forceN, moment, baseStress, deflection, stress_utilization, span_ratio)
        };
    }

    static generateSteps(beamType, beamSize, length, force, moment, stress, deflection, utilization, spanRatio) {
        return [
            {
                title: "Step 1: Identify Beam Properties",
                content: `Selected ${beamType.replace('_', ' ').toUpperCase()} with size ${beamSize}`
            },
            {
                title: "Step 2: Calculate Bending Moment",
                content: `For a simply supported beam with point load at center:\nM = Force × Length / 4\nM = ${force} N × ${length} mm / 4\nM = ${moment.toFixed(2)} N·mm`
            },
            {
                title: "Step 3: Calculate Bending Stress",
                content: `σ = Moment / Section Modulus\nσ = ${moment.toFixed(2)} N·mm / Z\nσ = ${stress.toFixed(2)} N/mm²`
            },
            {
                title: "Step 4: Calculate Deflection",
                content: `δ = (Force × Length³) / (48 × Young's Modulus × I)\nδ = ${deflection.toFixed(2)} mm`
            },
            {
                title: "Step 5: Check Stress Utilization",
                content: `Using typical yield strength of 275 N/mm² for mild steel:\nUtilization = (${stress.toFixed(2)} / 275) × 100%\nUtilization = ${utilization.toFixed(2)}%`
            },
            {
                title: "Step 6: Check Deflection Criteria",
                content: `Span/Deflection = ${length} / ${deflection.toFixed(2)} = ${spanRatio.toFixed(2)}\nTypical limit for serviceability: L/250 = ${(length/250).toFixed(2)} mm\nDeflection is ${spanRatio >= 250 ? 'acceptable' : 'excessive'}`
            }
        ];
    }
}