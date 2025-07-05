class CGPAPredictor {
  constructor() {
    this.numberOfSemesters = 0;
    this.currentSemester = 0;
    this.credits = [];
    this.earnedCGPAInPreviousSemesters = [];
    this.expectedCGPA = [];

    this.init();
  }

  init() {
    document.getElementById('totalSemesters').addEventListener('input', () => this.updateSemesterInputs());
    document.getElementById('currentSemester').addEventListener('input', () => this.updateSemesterInputs());
    document.getElementById('cgpaForm').addEventListener('submit', (e) => this.handleSubmit(e));

    document.addEventListener('input', (e) => {
      if (['prevCGPA', 'expectedCGPA', 'credits'].some(prefix => e.target.id.startsWith(prefix))) {
        this.tryAutoCalculate();
      }
    });
  }

  updateSemesterInputs() {
    const total = parseInt(document.getElementById('totalSemesters').value);
    const current = parseInt(document.getElementById('currentSemester').value);

    if (!total || !current) return;
    if (current > total) return this.showError('Current semester cannot exceed total semesters');

    this.hideError();
    this.numberOfSemesters = total;
    this.currentSemester = current;

    this.generateSemesterInputs();
    document.getElementById('semesterInputs').classList.add('show');
  }

  generateSemesterInputs() {
    const prevGrid = document.getElementById('previousCGPAGrid');
    const expGrid = document.getElementById('expectedCGPAGrid');
    const creditsGrid = document.getElementById('creditsGrid');

    prevGrid.innerHTML = expGrid.innerHTML = creditsGrid.innerHTML = '';

    document.getElementById('previousCGPASection').style.display = this.currentSemester > 1 ? 'block' : 'none';
    document.getElementById('expectedCGPASection').style.display = 'block';

    for (let i = 1; i < this.currentSemester; i++) {
      prevGrid.innerHTML += this.inputHTML(i, 'prevCGPA', 'CGPA');
    }
    for (let i = this.currentSemester; i <= this.numberOfSemesters; i++) {
      expGrid.innerHTML += this.inputHTML(i, 'expectedCGPA', 'Expected CGPA');
    }
    for (let i = 1; i <= this.numberOfSemesters; i++) {
      creditsGrid.innerHTML += this.inputHTML(i, 'credits', 'Credits', 0.5, 30);
    }
  }

  inputHTML(i, prefix, label, step = 0.01, max = 4) {
    return `
      <div class="semester-item">
        <label>Semester ${i} ${label}</label>
        <input type="number" step="${step}" min="0" max="${max}" id="${prefix}${i}" required />
      </div>`;
  }

  handleSubmit(e) {
    e.preventDefault();
    this.hideError();
    document.getElementById('result').classList.remove('show');

    try {
      this.collectInputData();
      const cgpa = this.predictCGPA();
      this.displayResult(cgpa);
    } catch (err) {
      this.showError(err.message);
    }
  }

  tryAutoCalculate() {
    if (!this.numberOfSemesters || !this.currentSemester) return;
    if (!this.areAllInputsFilled()) return;

    try {
      this.collectInputData();
      const cgpa = this.predictCGPA();
      this.displayResult(cgpa);
    } catch (err) {
      console.log('Auto-calc skipped:', err.message);
    }
  }

  areAllInputsFilled() {
    const required = [];

    for (let i = 1; i < this.currentSemester; i++) required.push(`prevCGPA${i}`);
    for (let i = this.currentSemester; i <= this.numberOfSemesters; i++) required.push(`expectedCGPA${i}`);
    for (let i = 1; i <= this.numberOfSemesters; i++) required.push(`credits${i}`);

    return required.every(id => {
      const el = document.getElementById(id);
      return el && el.value && !isNaN(parseFloat(el.value));
    });
  }

  collectInputData() {
    this.credits = [];
    this.earnedCGPAInPreviousSemesters = [];
    this.expectedCGPA = new Array(this.numberOfSemesters).fill(0);

    for (let i = 1; i < this.currentSemester; i++) {
      this.earnedCGPAInPreviousSemesters.push(this.getValidatedValue(`prevCGPA${i}`, 0, 4));
    }

    for (let i = this.currentSemester; i <= this.numberOfSemesters; i++) {
      this.expectedCGPA[i - 1] = this.getValidatedValue(`expectedCGPA${i}`, 0, 4);
    }

    for (let i = 1; i <= this.numberOfSemesters; i++) {
      this.credits.push(this.getValidatedValue(`credits${i}`, 0.01, 30));
    }
  }

  getValidatedValue(id, min, max) {
    const el = document.getElementById(id);
    const val = parseFloat(el?.value);
    if (!el || isNaN(val) || val < min || val > max) {
      throw new Error(`Invalid input for ${id}: must be between ${min} and ${max}`);
    }
    return val;
  }

  predictCGPA() {
    let sum = 0, totalCredits = 0;

    for (let i = 0; i < this.numberOfSemesters; i++) {
      const gpa = i < this.currentSemester - 1 ? this.earnedCGPAInPreviousSemesters[i] : this.expectedCGPA[i];
      sum += gpa * this.credits[i];
      totalCredits += this.credits[i];
    }

    if (totalCredits === 0) throw new Error('Total credits cannot be zero');
    return sum / totalCredits;
  }

  displayResult(cgpa) {
    document.getElementById('cgpaValue').textContent = cgpa.toFixed(2);
    const resultDiv = document.getElementById('result');
    resultDiv.classList.add('show');
    setTimeout(() => resultDiv.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  showError(message) {
    const el = document.getElementById('errorMessage');
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => this.hideError(), 5000);
  }

  hideError() {
    document.getElementById('errorMessage').classList.remove('show');
  }
}

// Theme toggle
function toggleTheme() {
  const body = document.body;
  const toggleBtn = document.querySelector('.theme-toggle');
  body.classList.toggle('dark');
  const isDark = body.classList.contains('dark');
  toggleBtn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    document.querySelector('.theme-toggle').textContent = '☀️ Light Mode';
  }

  new CGPAPredictor();
});
