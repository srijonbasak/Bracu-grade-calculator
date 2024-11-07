class GradeEditor {
    constructor(container) {
        this.container = container;
        this.header = container.querySelector('#header');
        this.semestersContainer = container.querySelector('#semesters');
        this.cgpaDisplay = container.querySelector('#cgpa-display');
    }

    init(data) {
        this.renderHeader(data.studentInfo);
        this.renderSemesters(data.semesters);
        this.initializeEventListeners();
        this.updateAllCalculations();
    }

    renderHeader(studentInfo) {
        this.header.innerHTML = `
            <h2>${studentInfo.name || 'Student'}</h2>
            <div class="student-info">
                <div class="info-item">ID: ${studentInfo.id || 'N/A'}</div>
                <div class="info-item">Program: ${studentInfo.program || 'N/A'}</div>
            </div>
        `;
    }

    renderSemesters(semesters) {
        this.semestersContainer.innerHTML = semesters.map(semester => `
            <div class="semester">
                <div class="semester-header">${semester.name}</div>
                <table class="grade-table">
                    <thead>
                        <tr>
                            <th>Course No</th>
                            <th>Course Title</th>
                            <th>Credit</th>
                            <th>Grade</th>
                            <th>Grade Point</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${semester.courses.map(course => this.generateCourseRow(course)).join('')}
                    </tbody>
                </table>
                <div class="semester-summary"></div>
                <div class="cumulative-summary"></div>
            </div>
        `).join('');
    }

    initializeEventListeners() {
        document.querySelectorAll('.grade-select').forEach(select => {
            select.addEventListener('change', this.handleGradeChange.bind(this));
        });
    }

    handleGradeChange(event) {
        const select = event.target;
        const row = select.closest('tr');
        const gradePointCell = row.querySelector('.grade-point');
        const newGrade = select.value;
        const newGradePoint = GradeCalculator.GRADE_POINTS[newGrade];
        
        gradePointCell.textContent = newGradePoint.toFixed(1);
        gradePointCell.classList.add('modified');
        select.classList.add('modified');
        
        this.updateAllCalculations();
    }

    generateCourseRow(course) {
        return `
            <tr class="course">
                <td>${course.courseNo}</td>
                <td>${course.courseTitle}</td>
                <td class="credit-cell">${course.credit}</td>
                <td>
                    <select class="grade-select" data-course="${course.courseNo}">
                        ${this.generateGradeOptions(course.grade)}
                    </select>
                </td>
                <td class="grade-point">${course.gradePoint}</td>
            </tr>
        `;
    }

    generateGradeOptions(selectedGrade) {
        const grades = Object.keys(GradeCalculator.GRADE_POINTS);
        return grades.map(grade => 
            `<option value="${grade}" ${grade === selectedGrade ? 'selected' : ''}>${grade}</option>`
        ).join('');
    }

    getEditorScripts() {
        return `
            // Initialize editor functionality
            document.querySelectorAll('.grade-select').forEach(select => {
                select.addEventListener('change', function() {
                    updateGrade(this);
                });
            });

            function updateGrade(select) {
                const row = select.closest('tr');
                const gradePointCell = row.querySelector('.grade-point');
                const newGrade = select.value;
                const newGradePoint = GradeCalculator.GRADE_POINTS[newGrade];
                
                gradePointCell.textContent = newGradePoint.toFixed(1);
                gradePointCell.classList.add('modified');
                select.classList.add('modified');
                
                updateAllCalculations();
            }

            function updateAllCalculations() {
                const semesters = Array.from(document.querySelectorAll('.semester')).map(semesterElem => ({
                    courses: Array.from(semesterElem.querySelectorAll('.course')).map(courseRow => ({
                        credit: parseFloat(courseRow.querySelector('.credit-cell').textContent),
                        grade: courseRow.querySelector('.grade-select').value
                    }))
                }));

                semesters.forEach((semester, index) => {
                    const semesterCalc = GradeCalculator.calculateSemesterGPA(semester.courses);
                    updateSemesterDisplay(document.querySelectorAll('.semester')[index], semesterCalc);
                });

                const cgpaCalc = GradeCalculator.calculateCGPA(semesters);
                updateCGPADisplay(cgpaCalc);
            }

            // Initialize calculations
            updateAllCalculations();
        `;
    }

    updateAllCalculations() {
        const semesters = document.querySelectorAll('.semester');
        let cumulativePoints = 0;
        let cumulativeCredits = 0;
        let cumulativeEarnedCredits = 0;

        semesters.forEach((semesterDiv, index) => {
            // Get all courses in this semester
            const courses = Array.from(semesterDiv.querySelectorAll('.course')).map(row => ({
                credit: parseFloat(row.querySelector('.credit-cell').textContent),
                grade: row.querySelector('.grade-select').value,
                gradePoint: GradeCalculator.GRADE_POINTS[row.querySelector('.grade-select').value]
            }));

            // Calculate semester totals
            const semesterCalc = GradeCalculator.calculateSemesterGPA(courses);
            
            // Update semester summary
            const summaryDiv = semesterDiv.querySelector('.semester-summary');
            summaryDiv.innerHTML = `
                <div class="summary-block">
                    <div class="summary-row">Credits Attempted: ${semesterCalc.creditsAttempted}</div>
                    <div class="summary-row">Credits Earned: ${semesterCalc.creditsEarned}</div>
                    <div class="summary-row">Semester GPA: ${semesterCalc.gpa}</div>
                </div>
            `;

            // Add to cumulative totals
            cumulativePoints += parseFloat(semesterCalc.totalPoints);
            cumulativeCredits += parseFloat(semesterCalc.creditsAttempted);
            cumulativeEarnedCredits += parseFloat(semesterCalc.creditsEarned);

            // Update cumulative summary for this semester
            const cumulativeGPA = (cumulativePoints / cumulativeCredits).toFixed(2);
            const cumulativeDiv = semesterDiv.querySelector('.cumulative-summary');
            cumulativeDiv.innerHTML = `
                <div class="summary-block">
                    <div class="summary-row">Cumulative Credits Attempted: ${cumulativeCredits.toFixed(1)}</div>
                    <div class="summary-row">Cumulative Credits Earned: ${cumulativeEarnedCredits.toFixed(1)}</div>
                    <div class="summary-row">Cumulative GPA: ${cumulativeGPA}</div>
                </div>
            `;
        });

        // Update final CGPA display
        const cgpaDisplay = document.getElementById('cgpa-display');
        const finalCGPA = (cumulativePoints / cumulativeCredits).toFixed(2);
        cgpaDisplay.innerHTML = `
            <div class="cgpa-final">
                <div class="cgpa-row">
                    <span>Total Credits:</span>
                    <span>${cumulativeCredits.toFixed(1)}</span>
                </div>
                <div class="cgpa-row">
                    <span>Earned Credits:</span>
                    <span>${cumulativeEarnedCredits.toFixed(1)}</span>
                </div>
                <div class="cgpa-row cgpa-main">
                    <span>Final CGPA:</span>
                    <span>${finalCGPA}</span>
                </div>
            </div>
        `;
    }
} 