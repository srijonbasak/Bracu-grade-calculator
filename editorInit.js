// This script will receive data from the parent window
window.addEventListener('message', function(event) {
    if (event.data.type === 'gradeData') {
        GradeEditor.init(event.data.data);
    }
}); 