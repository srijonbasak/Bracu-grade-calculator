class SemesterManager {
    static addNewSemester() {
        const semestersContainer = document.getElementById('semesters');
        const newSemester = this.createNewSemesterData();
        const semesterHTML = this.generateSemesterHTML(newSemester);
        
        // Add to bottom
        semestersContainer.appendChild(semesterHTML);
        this.initializeSemesterListeners(semesterHTML);
    }

    static createNewSemesterData() {
        const semesterCount = document.querySelectorAll('.semester').length + 1;
        return {
            name: `New Semester ${semesterCount}`,
            courses: [],
            summary: { creditsAttempted: 0, creditsEarned: 0, gpa: 0 },
            cumulative: { creditsAttempted: 0, creditsEarned: 0, cgpa: 0 }
        };
    }

    static addNewCourse(tbody) {
        const newRow = document.createElement('tr');
        newRow.className = 'course';
        newRow.innerHTML = this.generateNewCourseHTML();
        tbody.appendChild(newRow);
        this.initializeCourseListeners(newRow);
    }

    static initializeSemesterListeners(semesterElement) {
        const addCourseBtn = semesterElement.querySelector('.add-course-btn');
        addCourseBtn.addEventListener('click', () => {
            this.addNewCourse(semesterElement.querySelector('tbody'));
        });
    }

    static initializeCourseListeners(courseRow) {
        // Add delete button listener
        const deleteBtn = courseRow.querySelector('.delete-course-btn');
        deleteBtn.addEventListener('click', () => this.deleteCourse(courseRow));

        // Add grade change listener
        const gradeSelect = courseRow.querySelector('.grade-select');
        gradeSelect.addEventListener('change', () => this.updateGradePoint(courseRow));
    }

    static deleteCourse(courseRow) {
        if (confirm('Are you sure you want to delete this course?')) {
            courseRow.remove();
            GradeCalculator.recalculateAll();
        }
    }

    static updateGradePoint(courseRow) {
        const gradeSelect = courseRow.querySelector('.grade-select');
        const gradePointCell = courseRow.querySelector('.grade-point');
        const newGrade = gradeSelect.value;
        const newGradePoint = GradeCalculator.GRADE_POINTS[newGrade];
        
        gradePointCell.textContent = newGradePoint.toFixed(3);
        courseRow.classList.add('modified');
        GradeCalculator.recalculateAll();
    }
} 