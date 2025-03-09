import { beamSizes, propertyDescriptions } from './beamData.js';
import { BeamCalculator } from './calculator.js';

function updateSizes() {
    const beamType = document.getElementById('beam_type').value;
    const beamSizeSelect = document.getElementById('beam_size');
    beamSizeSelect.innerHTML = beamSizes[beamType]
        .map(size => `<option value="${size}">${size}</option>`)
        .join('');
}

function updateDbSizes() {
    const beamType = document.getElementById('db_beam_type').value;
    const beamSizeSelect = document.getElementById('db_beam_size');
    beamSizeSelect.innerHTML = beamSizes[beamType]
        .map(size => `<option value="${size}">${size}</option>`)
        .join('');
}

function calculate() {
    const beamType = document.getElementById('beam_type').value;
    const beamSize = document.getElementById('beam_size').value;
    const length = document.getElementById('length').value;
    const force = document.getElementById('force').value;
    
    const units = {
        length_unit: document.getElementById('length_unit').value,
        force_unit: document.getElementById('force_unit').value,
        stress_unit: document.getElementById('stress_unit').value,
        deflection_unit: document.getElementById('deflection_unit').value
    };

    if (!length || !force) {
        alert('Please enter length and force values');
        return;
    }

    const result = BeamCalculator.calculate(
        beamType,
        beamSize,
        parseFloat(length),
        parseFloat(force),
        units
    );
    
    document.getElementById('stress').textContent = result.stress;
    document.getElementById('deflection').textContent = result.deflection;
    
    const propertiesDiv = document.getElementById('properties');
    let propertiesHTML = '<table><tr><th>Property</th><th>Value</th><th>Description</th></tr>';
    
    for (const [key, value] of Object.entries(result.properties)) {
        const description = propertyDescriptions[key] || key;
        propertiesHTML += `<tr><td>${key}</td><td>${value}</td><td>${description}</td></tr>`;
    }
    
    propertiesHTML += '</table>';
    propertiesDiv.innerHTML = propertiesHTML;
}

function showStepByStep() {
    const beamType = document.getElementById('db_beam_type').value;
    const beamSize = document.getElementById('db_beam_size').value;
    const length = document.getElementById('db_length').value;
    const force = document.getElementById('db_force').value;

    if (!length || !force) {
        alert('Please enter length and force values');
        return;
    }

    const units = {
        length_unit: 'mm',
        force_unit: 'N',
        stress_unit: 'N/mm²',
        deflection_unit: 'mm'
    };

    const result = BeamCalculator.calculate(
        beamType,
        beamSize,
        parseFloat(length),
        parseFloat(force),
        units
    );
    
    const contentDiv = document.getElementById('step_by_step_content');
    let stepsHTML = '';
    
    result.steps.forEach(step => {
        stepsHTML += `
        <div class="step">
            <h4>${step.title}</h4>
            <pre>${step.content}</pre>
        </div>`;
    });
    
    stepsHTML += `
    <div class="calc-summary">
        <h3>Final Results</h3>
        <p><strong>Stress:</strong> ${result.stress} N/mm²</p>
        <p><strong>Deflection:</strong> ${result.deflection} mm</p>
        <p><strong>Stress Utilization:</strong> ${result.utilization}%</p>
        <p><strong>Span/Deflection Ratio:</strong> ${result.span_ratio}</p>
    </div>`;
    
    contentDiv.innerHTML = stepsHTML;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.textContent.toLowerCase().includes(tabId)) {
            tab.classList.add('active');
        }
    });
}

function toggleContent(id) {
    const content = document.getElementById(id);
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
}

// Export functions for use in HTML
window.updateSizes = updateSizes;
window.updateDbSizes = updateDbSizes;
window.calculate = calculate;
window.showStepByStep = showStepByStep;
window.switchTab = switchTab;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    updateSizes();
    updateDbSizes();
}); 