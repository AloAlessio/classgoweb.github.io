// Navigation utilities for ClassGo application
// Common navigation functions shared across pages

const ClassGoNavigation = {
    // Navigation paths
    paths: {
        root: '../../index.html',
        login: 'login.html',
        home: 'home.html',
        profile: 'profile.html',
        categories: 'categories.html'
    },

    // Navigate to a specific page
    navigateTo(page, delay = 0) {
        if (this.paths[page]) {
            if (delay > 0) {
                setTimeout(() => {
                    window.location.href = this.paths[page];
                }, delay);
            } else {
                window.location.href = this.paths[page];
            }
        } else {
            console.error(`Page "${page}" not found in navigation paths`);
        }
    },

    // Check if user is authenticated (placeholder)
    isAuthenticated() {
        // This would check Firebase auth state in a real app
        return localStorage.getItem('userAuthenticated') === 'true';
    },

    // Set user as authenticated
    setAuthenticated(status = true) {
        localStorage.setItem('userAuthenticated', status.toString());
    },

    // Logout user
    logout() {
        localStorage.removeItem('userAuthenticated');
        localStorage.removeItem('rememberUser');
        localStorage.removeItem('userEmail');
        this.navigateTo('login');
    },

    // Protect page (redirect to login if not authenticated)
    protectPage() {
        if (!this.isAuthenticated()) {
            this.navigateTo('login');
            return false;
        }
        return true;
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClassGoNavigation;
}