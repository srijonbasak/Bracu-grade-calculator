class GradeCalculator {
    static GRADE_POINTS = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'F': 0.0
    };

    static calculateSemesterGPA(courses) {
        let totalPoints = 0;
        let totalCredits = 0;
        let earnedCredits = 0;

        courses.forEach(course => {
            const credit = parseFloat(course.credit);
            const gradePoint = this.GRADE_POINTS[course.grade];
            
            if (!isNaN(credit) && gradePoint !== undefined) {
                totalPoints += credit * gradePoint;
                totalCredits += credit;
                if (course.grade !== 'F') {
                    earnedCredits += credit;
                }
            }
        });

        return {
            gpa: totalCredits > 0 ? (totalPoints / totalCredits).toFixed(3) : '0.000',
            creditsAttempted: totalCredits.toFixed(3),
            creditsEarned: earnedCredits.toFixed(3),
            totalPoints: totalPoints
        };
    }

    static calculateCGPA(semesters) {
        let totalPoints = 0;
        let totalCredits = 0;
        let totalEarnedCredits = 0;

        semesters.forEach(semester => {
            const semesterCalc = this.calculateSemesterGPA(semester.courses);
            totalPoints += parseFloat(semesterCalc.totalPoints);
            totalCredits += parseFloat(semesterCalc.creditsAttempted);
            totalEarnedCredits += parseFloat(semesterCalc.creditsEarned);
        });

        return {
            cgpa: totalCredits > 0 ? (totalPoints / totalCredits).toFixed(3) : '0.000',
            totalCredits: totalCredits.toFixed(3),
            earnedCredits: totalEarnedCredits.toFixed(3),
            totalPoints: totalPoints
        };
    }

    static recalculateAll() {
        const semesters = Array.from(document.querySelectorAll('.semester')).map(semester => ({
            courses: Array.from(semester.querySelectorAll('.course')).map(course => ({
                credit: parseFloat(course.querySelector('.credit-cell').textContent),
                grade: course.querySelector('.grade-select').value
            }))
        }));

        let cumulativeData = { totalPoints: 0, totalCredits: 0, earnedCredits: 0 };

        semesters.forEach((semester, index) => {
            const semesterCalc = this.calculateSemesterGPA(semester.courses);
            const semesterElement = document.querySelectorAll('.semester')[index];
            
            // Update semester summary
            this.updateSemesterSummary(semesterElement, semesterCalc);
            
            // Update cumulative
            cumulativeData.totalPoints += parseFloat(semesterCalc.totalPoints);
            cumulativeData.totalCredits += parseFloat(semesterCalc.creditsAttempted);
            cumulativeData.earnedCredits += parseFloat(semesterCalc.creditsEarned);
            
            this.updateCumulativeSummary(semesterElement, cumulativeData);
        });

        this.updateFinalCGPA(cumulativeData);
    }

    static updateSemesterSummary(semesterElement, data) {
        const summaryDiv = semesterElement.querySelector('.semester-summary');
        summaryDiv.innerHTML = `
            <div class="summary-grid">
                <span>Credits Attempted: ${data.creditsAttempted}</span>
                <span>Credits Earned: ${data.creditsEarned}</span>
                <span>Semester GPA: ${data.gpa}</span>
            </div>
        `;
    }

    static updateCumulativeSummary(semesterElement, data) {
        const cumulativeDiv = semesterElement.querySelector('.cumulative-summary');
        const cgpa = (data.totalPoints / data.totalCredits).toFixed(3);
        cumulativeDiv.innerHTML = `
            <div class="summary-grid">
                <span>Cumulative Credits: ${data.totalCredits.toFixed(3)}</span>
                <span>Cumulative Earned: ${data.earnedCredits.toFixed(3)}</span>
                <span>Cumulative GPA: ${cgpa}</span>
            </div>
        `;
    }

    static updateFinalCGPA(data) {
        const cgpaDisplay = document.getElementById('cgpa-display');
        const cgpa = (data.totalPoints / data.totalCredits).toFixed(3);
        cgpaDisplay.innerHTML = `
            <div class="cgpa-final">
                <div class="cgpa-row">
                    <span>Total Credits: ${data.totalCredits.toFixed(3)}</span>
                </div>
                <div class="cgpa-row">
                    <span>Earned Credits: ${data.earnedCredits.toFixed(3)}</span>
                </div>
                <div class="cgpa-row cgpa-main">
                    <span>Final CGPA: ${cgpa}</span>
                </div>
            </div>
        `;
    }
} 