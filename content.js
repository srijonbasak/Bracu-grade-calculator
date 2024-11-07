console.log("BRACU Grade Calculator initializing...");

class GradeSheetController {
    static init() {
        // Check if we're on the grade sheet page
        if (window.location.href.includes('loadPreviousResultByStudent')) {
            this.addEditorButton();
        }
    }

    static addEditorButton() {
        const button = document.createElement('button');
        button.id = 'grade-editor-button';
        button.textContent = 'Open Grade Editor';
        this.styleButton(button);
        
        button.addEventListener('click', () => {
            const data = this.extractGradeData();
            if (data) {
                this.createEditorInterface(data);
            }
        });
        
        document.body.appendChild(button);
    }

    static styleButton(button) {
        Object.assign(button.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: '9999',
            padding: '6px 12px',
            backgroundColor: '#705C53',
            color: '#F5F5F7',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease'
        });

        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#B7B7B7';
            button.style.transform = 'scale(1.05)';
        });

        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#705C53';
            button.style.transform = 'scale(1)';
        });
    }

    static extractGradeData() {
        const gradeData = {
            studentInfo: this.extractStudentInfo(),
            semesters: this.extractSemesters()
        };

        console.log("Extracted data:", gradeData);
        return gradeData;
    }

    static extractStudentInfo() {
        const studentInfo = {};
        
        try {
            // Find the text content that matches the pattern
            const text = document.body.textContent;
            
            // Extract Student ID
            const idMatch = text.match(/Student ID\s*:\s*(\d+)/);
            if (idMatch) {
                studentInfo.id = idMatch[1];
            }
            
            // Extract Name
            const nameMatch = text.match(/Name\s*:\s*([^\n]+)/);
            if (nameMatch) {
                studentInfo.name = nameMatch[1].trim();
            }
            
            // Extract Program
            const programMatch = text.match(/Program\s*:\s*([^\n]+)/);
            if (programMatch) {
                studentInfo.program = programMatch[1].trim();
            }

            console.log("Extracted student info:", studentInfo);
        } catch (error) {
            console.error("Error extracting student info:", error);
        }

        return {
            id: studentInfo.id || 'undefined',
            name: studentInfo.name || 'undefined',
            program: studentInfo.program || 'undefined'
        };
    }

    static extractSemesters() {
        const semesters = [];
        let currentSemester = null;
        const rows = document.querySelectorAll('tr');

        rows.forEach(row => {
            const cells = row.cells;
            if (!cells || cells.length === 0) return;

            const firstCell = cells[0].textContent.trim();

            if (firstCell.includes('SEMESTER :')) {
                currentSemester = {
                    name: firstCell.split(':')[1].trim(),
                    courses: [],
                    summary: {},
                    cumulative: {}
                };
                semesters.push(currentSemester);
            } else if (currentSemester && cells.length >= 6 && 
                      !firstCell.includes('SEMESTER') && 
                      !firstCell.includes('CUMULATIVE') &&
                      firstCell !== 'Course No') {
                currentSemester.courses.push({
                    courseNo: firstCell,
                    courseTitle: cells[1].textContent.trim(),
                    credit: parseFloat(cells[2].textContent.trim()) || 0,
                    creditEarned: parseFloat(cells[3].textContent.trim()) || 0,
                    grade: cells[4].textContent.trim(),
                    gradePoint: parseFloat(cells[5].textContent.trim()) || 0
                });
            } else if (currentSemester && firstCell === 'SEMESTER') {
                currentSemester.summary = this.extractSummary(cells);
            } else if (currentSemester && firstCell === 'CUMULATIVE') {
                currentSemester.cumulative = this.extractSummary(cells);
            }
        });

        return semesters;
    }

    static extractSummary(cells) {
        return {
            creditsAttempted: parseFloat(cells[1].textContent.trim()) || 0,
            creditsEarned: parseFloat(cells[3].textContent.trim()) || 0,
            gpa: parseFloat(cells[5].textContent.trim()) || 0
        };
    }

    static createEditorInterface(data) {
        const editorContainer = document.createElement('div');
        editorContainer.id = 'grade-editor-container';

        const overlay = document.createElement('div');
        overlay.className = 'editor-overlay';

        // Create the basic structure with updated header layout
        editorContainer.innerHTML = `
            <div class="container">
                <div id="header" class="header">
                    <div class="student-info">
                        <div class="student-name">${data.studentInfo.name.toUpperCase()}</div>
                        <div class="student-program">${data.studentInfo.program}</div>
                        <div class="student-id">${data.studentInfo.id}</div>
                    </div>
                </div>
                <div id="semesters">
                    ${data.semesters.map(semester => this.generateSemesterHTML(semester)).join('')}
                </div>
                <div class="add-semester-container">
                    <button id="add-semester-btn" class="add-semester-btn">+ Add New Semester</button>
                </div>
                <div id="cgpa-display"></div>
            </div>
        `;

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.className = 'close-button';
        closeButton.onclick = () => {
            document.body.removeChild(overlay);
            document.body.removeChild(editorContainer);
        };
        
        editorContainer.appendChild(closeButton);
        document.body.appendChild(overlay);
        document.body.appendChild(editorContainer);

        // Initialize grade selects and calculations
        this.initializeGradeSelects(editorContainer);
        this.initializeDeleteButtons(editorContainer);
        this.calculateAllGPAs(editorContainer);

        // Add semester button handler
        const addSemesterBtn = editorContainer.querySelector('#add-semester-btn');
        addSemesterBtn.addEventListener('click', () => this.addNewSemester(editorContainer));
    }

    static generateSemesterHTML(semester, isNewSemester = false) {
        return `
            <div class="semester ${isNewSemester ? 'new-semester' : ''}">
                <table class="grade-table">
                    <thead>
                        <tr>
                            <th>Course No</th>
                            <th>Course Title</th>
                            <th>Credit</th>
                            <th>Grade</th>
                            <th>Grade Point</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${semester.courses.map(course => this.generateCourseRow(course)).join('')}
                    </tbody>
                </table>
                ${isNewSemester ? `
                    <div class="add-course-container">
                        <button class="add-course-btn">+ Add Course</button>
                    </div>
                ` : ''}
                <div class="stats-container">
                    <div class="stat-item">Credits Attempted: ${semester.summary.creditsAttempted}</div>
                    <div class="stat-item">Credits Earned: ${semester.summary.creditsEarned}</div>
                    <div class="stat-item">Semester GPA: ${semester.summary.gpa}</div>
                </div>
                <div class="stats-container">
                    <div class="stat-item">Cumulative Credits: ${semester.cumulative.creditsAttempted}</div>
                    <div class="stat-item">Cumulative Earned: ${semester.cumulative.creditsEarned}</div>
                    <div class="stat-item">Cumulative GPA: ${semester.cumulative.cgpa}</div>
                </div>
            </div>
        `;
    }

    static generateCourseRow(course) {
        return `
            <tr class="course">
                <td>${course.courseNo}</td>
                <td>${course.courseTitle}</td>
                <td class="credit-cell">${course.credit}</td>
                <td>
                    <select class="grade-select" data-original="${course.grade}">
                        ${this.generateGradeOptions(course.grade)}
                    </select>
                </td>
                <td class="grade-point">${course.gradePoint}</td>
                <td>
                    <button class="delete-course-btn">Delete</button>
                </td>
            </tr>
        `;
    }

    static generateGradeOptions(selectedGrade) {
        const grades = Object.keys(GradeCalculator.GRADE_POINTS);
        return grades.map(grade => 
            `<option value="${grade}" ${grade === selectedGrade ? 'selected' : ''}>${grade}</option>`
        ).join('');
    }

    static initializeGradeSelects(container) {
        container.querySelectorAll('.grade-select').forEach(select => {
            select.addEventListener('change', () => {
                const row = select.closest('tr');
                const gradePointCell = row.querySelector('.grade-point');
                const newGrade = select.value;
                const newGradePoint = GradeCalculator.GRADE_POINTS[newGrade];
                
                gradePointCell.textContent = newGradePoint.toFixed(3);
                row.classList.add('modified');
                
                this.calculateAllGPAs(container);
            });
        });
    }

    static calculateAllGPAs(container) {
        const semesters = container.querySelectorAll('.semester');
        let cumulativePoints = 0;
        let cumulativeCredits = 0;
        let cumulativeEarnedCredits = 0;

        semesters.forEach((semester, index) => {
            // Calculate semester totals
            let semesterPoints = 0;
            let semesterCredits = 0;
            let semesterEarnedCredits = 0;

            const courses = semester.querySelectorAll('.course');
            courses.forEach(course => {
                const credit = parseFloat(course.querySelector('.credit-cell').textContent);
                const grade = course.querySelector('.grade-select').value;
                const gradePoint = GradeCalculator.GRADE_POINTS[grade];

                if (!isNaN(credit) && gradePoint !== undefined) {
                    semesterPoints += credit * gradePoint;
                    semesterCredits += credit;
                    if (grade !== 'F') {
                        semesterEarnedCredits += credit;
                    }
                }
            });

            // Update semester summary
            const semesterGPA = semesterCredits > 0 ? (semesterPoints / semesterCredits).toFixed(3) : '0.000';
            const statsContainer = semester.querySelector('.stats-container') || 
                semester.appendChild(document.createElement('div'));
            statsContainer.className = 'stats-container';
            
            statsContainer.innerHTML = `
                <div class="stat-item">Credits Attempted: ${semesterCredits.toFixed(3)}</div>
                <div class="stat-item">Credits Earned: ${semesterEarnedCredits.toFixed(3)}</div>
                <div class="stat-item">Semester GPA: ${semesterGPA}</div>
            `;

            // Add to cumulative totals
            cumulativePoints += semesterPoints;
            cumulativeCredits += semesterCredits;
            cumulativeEarnedCredits += semesterEarnedCredits;

            // Update cumulative summary
            const cumulativeGPA = (cumulativePoints / cumulativeCredits).toFixed(3);
            const cumulativeStatsContainer = semester.querySelector('.stats-container:last-child') || 
                semester.appendChild(document.createElement('div'));
            cumulativeStatsContainer.className = 'stats-container';
            
            cumulativeStatsContainer.innerHTML = `
                <div class="stat-item">Cumulative Credits: ${cumulativeCredits.toFixed(3)}</div>
                <div class="stat-item">Cumulative Earned: ${cumulativeEarnedCredits.toFixed(3)}</div>
                <div class="stat-item">Cumulative GPA: ${cumulativeGPA}</div>
            `;
        });

        // Update final CGPA display
        const cgpaDisplay = container.querySelector('#cgpa-display');
        if (cgpaDisplay) {
            const finalCGPA = cumulativeCredits > 0 ? (cumulativePoints / cumulativeCredits).toFixed(3) : '0.000';
            cgpaDisplay.innerHTML = `
                <div class="cgpa-final">
                    <div class="cgpa-row">
                        <span>Total Credits: ${cumulativeCredits.toFixed(3)}</span>
                    </div>
                    <div class="cgpa-row">
                        <span>Earned Credits: ${cumulativeEarnedCredits.toFixed(3)}</span>
                    </div>
                    <div class="cgpa-row cgpa-main">
                        <span>Final CGPA: ${finalCGPA}</span>
                    </div>
                </div>
            `;
        }
    }

    static addNewSemester(container) {
        const semestersContainer = container.querySelector('#semesters');
        const semesterCount = semestersContainer.querySelectorAll('.semester').length + 1;
        
        const newSemesterDiv = document.createElement('div');
        newSemesterDiv.className = 'semester new-semester';
        newSemesterDiv.innerHTML = `
            <div class="semester-header">
                <span>New Semester ${semesterCount}</span>
                <button class="add-course-btn">+ Add Course</button>
            </div>
            <table class="grade-table">
                <thead>
                    <tr>
                        <th>Course No</th>
                        <th>Course Title</th>
                        <th>Credit</th>
                        <th>Grade</th>
                        <th>Grade Point</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <div class="stats-container">
                <div class="stat-item">Credits Attempted: 0.000</div>
                <div class="stat-item">Credits Earned: 0.000</div>
                <div class="stat-item">Semester GPA: 0.000</div>
            </div>
            <div class="stats-container">
                <div class="stat-item">Cumulative Credits: 0.000</div>
                <div class="stat-item">Cumulative Earned: 0.000</div>
                <div class="stat-item">Cumulative GPA: 0.000</div>
            </div>
        `;

        semestersContainer.appendChild(newSemesterDiv);

        // Add event listener for the add course button
        const addCourseBtn = newSemesterDiv.querySelector('.add-course-btn');
        addCourseBtn.addEventListener('click', () => {
            const tbody = newSemesterDiv.querySelector('tbody');
            this.addNewCourse(tbody);
        });

        // Initialize delete buttons for existing courses
        newSemesterDiv.querySelectorAll('.delete-course-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this course?')) {
                    btn.closest('tr').remove();
                    this.calculateAllGPAs(container);
                }
            });
        });
    }

    static initializeNewSemester(semesterDiv) {
        // Add course button handler
        const addCourseBtn = semesterDiv.querySelector('.add-course-btn');
        addCourseBtn.addEventListener('click', () => {
            const tbody = semesterDiv.querySelector('tbody');
            this.addNewCourse(tbody);
        });

        // Initialize calculations
        this.calculateAllGPAs(semesterDiv.closest('#grade-editor-container'));
    }

    static addNewCourse(tbody) {
        const newRow = document.createElement('tr');
        newRow.className = 'course';
        newRow.innerHTML = `
            <td><input type="text" class="course-input" placeholder="Course No"></td>
            <td><input type="text" class="course-input" placeholder="Course Title"></td>
            <td class="credit-cell"><input type="number" value="3.0" min="0" max="4" step="0.1"></td>
            <td>
                <select class="grade-select">
                    ${Object.keys(GradeCalculator.GRADE_POINTS).map(grade => 
                        `<option value="${grade}">${grade}</option>`
                    ).join('')}
                </select>
            </td>
            <td class="grade-point">4.000</td>
            <td class="action-cell">
                <button class="delete-course-btn">Delete</button>
            </td>
        `;

        tbody.appendChild(newRow);

        // Add event listeners for the new row
        const gradeSelect = newRow.querySelector('.grade-select');
        gradeSelect.addEventListener('change', () => {
            const gradePointCell = newRow.querySelector('.grade-point');
            const newGrade = gradeSelect.value;
            const newGradePoint = GradeCalculator.GRADE_POINTS[newGrade];
            gradePointCell.textContent = newGradePoint.toFixed(3);
            this.calculateAllGPAs(newRow.closest('#grade-editor-container'));
        });

        const deleteBtn = newRow.querySelector('.delete-course-btn');
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this course?')) {
                newRow.remove();
                this.calculateAllGPAs(tbody.closest('#grade-editor-container'));
            }
        });

        // Add input event listeners
        const inputs = newRow.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.calculateAllGPAs(newRow.closest('#grade-editor-container'));
            });
        });
    }

    static initializeDeleteButtons(container) {
        container.querySelectorAll('.delete-course-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this course?')) {
                    btn.closest('tr').remove();
                    this.calculateAllGPAs(container);
                }
            });
        });
    }
}

// Initialize when the page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GradeSheetController.init());
} else {
    GradeSheetController.init();
}