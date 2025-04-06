document.getElementById('toggleSidebar').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    const container = document.querySelector('.sidebar-container');
    
    // Toggle collapsed state
    container.classList.toggle('sidebar-collapsed');
    
    // Update icon
    const icon = this.querySelector('i');
    icon.classList.toggle('bi-chevron-double-left');
    icon.classList.toggle('bi-chevron-double-right');
});