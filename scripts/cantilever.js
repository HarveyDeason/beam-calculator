import { BEAM_PROPERTIES, beamSizes } from './beamData.js';

export class CantileverBeamCalculator {
    static YOUNG_MODULUS = 210000;  // Young's Modulus for mild steel (N/mm²)

    static calculate(beamType, beamSize, length, force, distanceFromFixedEnd, units) {
        // Convert inputs to base units (mm and N)
        let lengthMM = length;
        switch (units.length_unit) {
            case 'm': lengthMM = length * 1000; break;
            case 'cm': lengthMM = length * 10; break;
        }

        let forceN = force;
        switch (units.force_unit) {
            case 'kN': forceN = force * 1000; break;
            case 'kg': forceN = force * 9.81; break;
        }

        let distanceMM = distanceFromFixedEnd;
        switch (units.distance_unit) {
            case 'm': distanceMM = distanceFromFixedEnd * 1000; break;
            case 'cm': distanceMM = distanceFromFixedEnd * 10; break;
        }

        // Validate beam type and size
        if (!BEAM_PROPERTIES[beamType] || !BEAM_PROPERTIES[beamType][beamSize]) {
            throw new Error(`Invalid beam type or size: ${beamType}, ${beamSize}`);
        }

        const beam = BEAM_PROPERTIES[beamType][beamSize];

        // Use the correct properties for hollow sections
        let I, Z;
        if (beamType === 'chs' || beamType === 'shs' || beamType === 'rhs') {
            // For hollow sections, use I and Z directly
            I = beam.I || beam.I_major; // Use I_major for RHS
            Z = beam.Z || beam.Z_major; // Use Z_major for RHS
        } else {
            // For other sections (angles, I-beams, etc.), use I and Z
            I = beam.I;
            Z = beam.Z;
        }

        // Calculate bending moment
        const moment = forceN * distanceMM;

        // Calculate bending stress
        let stress = moment / Z;

        // Calculate deflection
        let deflection = (forceN * Math.pow(distanceMM, 2) * (3 * lengthMM - distanceMM)) / (6 * this.YOUNG_MODULUS * I);

        // Convert outputs to selected units
        switch (units.stress_unit) {
            case 'MPa': break; // Same as N/mm²
            case 'kPa': stress /= 1000; break;
        }

        switch (units.deflection_unit) {
            case 'cm': deflection /= 10; break;
            case 'm': deflection /= 1000; break;
        }

        // Calculate utilization (always using base units N/mm²)
        const baseStress = moment / Z;  // Calculate stress in N/mm² for utilization
        const allowable_stress = 275; // Allowable stress for mild steel (N/mm²)
        const stress_utilization = (baseStress / allowable_stress) * 100;

        const span_ratio = lengthMM / deflection;

        return {
            stress: stress.toFixed(2),
            deflection: deflection.toFixed(2),
            properties: beam,
            utilization: stress_utilization.toFixed(2),
            span_ratio: span_ratio.toFixed(2),
            steps: this.generateSteps(beamType, beamSize, lengthMM, forceN, distanceMM, moment, baseStress, deflection, stress_utilization, span_ratio)
        };
    }

    static generateSteps(beamType, beamSize, length, force, distance, moment, stress, deflection, utilization, spanRatio) {
        return [
            {
                title: "Step 1: Identify Beam Properties",
                content: `Selected ${beamType.replace('_', ' ').toUpperCase()} with size ${beamSize}`
            },
            {
                title: "Step 2: Calculate Bending Moment",
                content: `For a cantilever beam with point load at distance from fixed end:\nM = Force × Distance\nM = ${force} N × ${distance} mm\nM = ${moment.toFixed(2)} N·mm`
            },
            {
                title: "Step 3: Calculate Bending Stress",
                content: `σ = Moment / Section Modulus\nσ = ${moment.toFixed(2)} N·mm / Z\nσ = ${stress.toFixed(2)} N/mm²`
            },
            {
                title: "Step 4: Calculate Deflection",
                content: `δ = (Force × Distance² × (3 × Length - Distance)) / (6 × Young's Modulus × I)\nδ = ${deflection.toFixed(2)} mm`
            },
            {
                title: "Step 5: Check Stress Utilization",
                content: `Using typical yield strength of 275 N/mm² for mild steel:\nUtilization = (${stress.toFixed(2)} / 275) × 100%\nUtilization = ${utilization.toFixed(2)}%`
            },
            {
                title: "Step 6: Check Deflection Criteria",
                content: `Span/Deflection = ${length} / ${deflection.toFixed(2)} = ${spanRatio.toFixed(2)}\nTypical limit for serviceability: L/250 = ${(length / 250).toFixed(2)} mm\nDeflection is ${spanRatio >= 250 ? 'acceptable' : 'excessive'}`
            }
        ];
    }
}

// Define propertyDescriptions if missing
const propertyDescriptions = {
    I: "Moment of Inertia (mm⁴)",
    Z: "Section Modulus (mm³)",
    I_major: "Major Moment of Inertia (mm⁴)",
    Z_major: "Major Section Modulus (mm³)"
};

function calculateCantilever() {
    const beamType = document.getElementById('cantilever_beam_type').value;
    const beamSize = document.getElementById('cantilever_beam_size').value;
    const length = document.getElementById('cantilever_length').value;
    const force = document.getElementById('cantilever_force').value;
    const distanceFromFixedEnd = document.getElementById('distance_from_fixed_end').value;

    console.log("Inputs:", { beamType, beamSize, length, force, distanceFromFixedEnd });

    if (!length || !force || !distanceFromFixedEnd) {
        alert('Please enter length, force, and distance from fixed end values');
        return;
    }

    const units = {
        length_unit: document.getElementById('cantilever_length_unit').value,
        force_unit: document.getElementById('cantilever_force_unit').value,
        distance_unit: document.getElementById('distance_unit').value,
        stress_unit: 'N/mm²', // Default stress unit
        deflection_unit: 'mm' // Default deflection unit
    };

    try {
        const result = CantileverBeamCalculator.calculate(
            beamType,
            beamSize,
            parseFloat(length),
            parseFloat(force),
            parseFloat(distanceFromFixedEnd),
            units
        );

        console.log("Calculation Result:", result);

        // Display results
        document.getElementById('cantilever_stress').textContent = result.stress;
        document.getElementById('cantilever_deflection').textContent = result.deflection;

        const propertiesDiv = document.getElementById('cantilever_properties');
        let propertiesHTML = '<table><tr><th>Property</th><th>Value</th><th>Description</th></tr>';

        for (const [key, value] of Object.entries(result.properties)) {
            const description = propertyDescriptions[key] || key;
            propertiesHTML += `<tr><td>${key}</td><td>${value}</td><td>${description}</td></tr>`;
        }

        propertiesHTML += '</table>';
        propertiesDiv.innerHTML = propertiesHTML;
    } catch (error) {
        console.error("Error during calculation:", error);
        alert("An error occurred during calculation. Please check your inputs and try again.");
    }
}

function updateCantileverSizes() {
    const beamType = document.getElementById('cantilever_beam_type').value;
    const beamSizeSelect = document.getElementById('cantilever_beam_size');
    beamSizeSelect.innerHTML = beamSizes[beamType]
        .map(size => `<option value="${size}">${size}</option>`)
        .join('');
}

// Export the function for use in HTML
window.calculateCantilever = calculateCantilever;
window.updateCantileverSizes = updateCantileverSizes;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    updateCantileverSizes(); // Call this to populate sizes on load
});