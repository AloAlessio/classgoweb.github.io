// =============================================================
// 🎓 CLASSGO CERTIFICATE GENERATOR
// Professional PDF Certificate System
// Certified by Microsoft & ClassGo
// =============================================================

class CertificateGenerator {
    constructor() {
        this.colors = {
            // ClassGo brand colors
            primary: '#0d7377',
            primaryDark: '#0a5f62',
            primaryLight: '#14919B',
            accent: '#00ffd1',
            accentGold: '#FFD700',
            textDark: '#1a1a2e',
            textLight: '#ffffff',
            gray: '#6b7280',
            border: '#e5e7eb'
        };
        
        this.fonts = {
            title: 'Georgia, serif',
            body: 'Arial, sans-serif',
            elegant: 'Times New Roman, serif'
        };
    }

    /**
     * Generate a professional certificate PDF
     * @param {Object} data - Certificate data
     * @param {string} data.studentName - Name of the student
     * @param {string} data.courseName - Name of the completed course
     * @param {string} data.tutorName - Name of the tutor
     * @param {number} data.grade - Final grade (0-10)
     * @param {string} data.completionDate - Date of completion
     * @param {string} data.certificateId - Unique certificate ID
     * @param {number} data.duration - Course duration in hours
     * @param {string} data.category - Course category
     */
    async generateCertificate(data) {
        // Create canvas for the certificate
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Certificate dimensions (A4 landscape in pixels at 96 DPI)
        const width = 1123;  // ~297mm
        const height = 794;  // ~210mm
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw certificate
        await this.drawCertificate(ctx, width, height, data);
        
        // Convert to PDF using canvas-to-blob and download
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    // Create download link
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Certificado_${data.courseName.replace(/\s+/g, '_')}_${data.studentName.replace(/\s+/g, '_')}.png`;
                    
                    // For better quality, we'll also create a PDF version
                    this.createPDFFromCanvas(canvas, data).then(pdfBlob => {
                        resolve({
                            imageUrl: url,
                            imageBlob: blob,
                            pdfBlob: pdfBlob,
                            canvas: canvas
                        });
                    });
                } else {
                    reject(new Error('Failed to create certificate image'));
                }
            }, 'image/png', 1.0);
        });
    }

    async drawCertificate(ctx, width, height, data) {
        // === BACKGROUND ===
        // Main gradient background
        const bgGradient = ctx.createLinearGradient(0, 0, width, height);
        bgGradient.addColorStop(0, '#f8fafc');
        bgGradient.addColorStop(0.5, '#ffffff');
        bgGradient.addColorStop(1, '#f1f5f9');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // === DECORATIVE BORDER ===
        this.drawDecorativeBorder(ctx, width, height);

        // === HEADER SECTION ===
        await this.drawHeader(ctx, width, data);

        // === MAIN CONTENT ===
        this.drawMainContent(ctx, width, height, data);

        // === FOOTER WITH SIGNATURES ===
        this.drawFooter(ctx, width, height, data);

        // === DECORATIVE ELEMENTS ===
        this.drawDecorativeElements(ctx, width, height);

        // === SECURITY WATERMARK ===
        this.drawWatermark(ctx, width, height, data);
    }

    drawDecorativeBorder(ctx, width, height) {
        const borderWidth = 15;
        const innerMargin = 30;

        // Outer border - gradient teal
        const borderGradient = ctx.createLinearGradient(0, 0, width, 0);
        borderGradient.addColorStop(0, this.colors.primary);
        borderGradient.addColorStop(0.5, this.colors.primaryLight);
        borderGradient.addColorStop(1, this.colors.primary);
        
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(borderWidth/2, borderWidth/2, width - borderWidth, height - borderWidth);

        // Inner decorative border
        ctx.strokeStyle = this.colors.accentGold;
        ctx.lineWidth = 2;
        ctx.strokeRect(innerMargin, innerMargin, width - innerMargin * 2, height - innerMargin * 2);

        // Corner ornaments
        this.drawCornerOrnaments(ctx, width, height, innerMargin);
    }

    drawCornerOrnaments(ctx, width, height, margin) {
        const ornamentSize = 40;
        const positions = [
            { x: margin, y: margin },
            { x: width - margin, y: margin },
            { x: margin, y: height - margin },
            { x: width - margin, y: height - margin }
        ];

        ctx.fillStyle = this.colors.accentGold;
        
        positions.forEach((pos, index) => {
            ctx.save();
            ctx.translate(pos.x, pos.y);
            
            // Rotate based on corner position
            const rotations = [0, 90, -90, 180];
            ctx.rotate(rotations[index] * Math.PI / 180);
            
            // Draw ornament
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(ornamentSize, 0);
            ctx.lineTo(ornamentSize, 5);
            ctx.lineTo(5, 5);
            ctx.lineTo(5, ornamentSize);
            ctx.lineTo(0, ornamentSize);
            ctx.closePath();
            ctx.fill();
            
            // Inner detail
            ctx.fillStyle = this.colors.primary;
            ctx.fillRect(8, 8, 3, 25);
            ctx.fillRect(8, 8, 25, 3);
            
            ctx.restore();
        });
    }

    async drawHeader(ctx, width, data) {
        const centerX = width / 2;
        let yPos = 70;

        // === LOGOS SECTION ===
        // ClassGo Logo (left side)
        this.drawClassGoLogo(ctx, 100, yPos + 10, 0.8);
        
        // Microsoft Logo (right side)
        this.drawMicrosoftLogo(ctx, width - 180, yPos + 5, 0.6);

        // === CERTIFICATE TITLE ===
        yPos = 140;
        
        // "CERTIFICADO" text with elegant styling
        ctx.textAlign = 'center';
        ctx.fillStyle = this.colors.primary;
        ctx.font = `bold 14px ${this.fonts.body}`;
        ctx.letterSpacing = '8px';
        ctx.fillText('✦  CERTIFICADO DE FINALIZACIÓN  ✦', centerX, yPos);

        yPos += 50;
        
        // Main title
        const titleGradient = ctx.createLinearGradient(centerX - 200, yPos, centerX + 200, yPos);
        titleGradient.addColorStop(0, this.colors.primary);
        titleGradient.addColorStop(0.5, this.colors.primaryLight);
        titleGradient.addColorStop(1, this.colors.primary);
        
        ctx.fillStyle = titleGradient;
        ctx.font = `bold 42px ${this.fonts.title}`;
        ctx.fillText('CERTIFICADO', centerX, yPos);
        
        yPos += 35;
        ctx.fillStyle = this.colors.gray;
        ctx.font = `italic 18px ${this.fonts.elegant}`;
        ctx.fillText('de Excelencia Académica', centerX, yPos);

        // Decorative line under title
        yPos += 25;
        const lineWidth = 300;
        const lineGradient = ctx.createLinearGradient(centerX - lineWidth/2, yPos, centerX + lineWidth/2, yPos);
        lineGradient.addColorStop(0, 'transparent');
        lineGradient.addColorStop(0.2, this.colors.accentGold);
        lineGradient.addColorStop(0.5, this.colors.accentGold);
        lineGradient.addColorStop(0.8, this.colors.accentGold);
        lineGradient.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - lineWidth/2, yPos);
        ctx.lineTo(centerX + lineWidth/2, yPos);
        ctx.stroke();
    }

    drawClassGoLogo(ctx, x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        // Logo circle background
        const gradient = ctx.createRadialGradient(35, 35, 0, 35, 35, 40);
        gradient.addColorStop(0, this.colors.primaryLight);
        gradient.addColorStop(1, this.colors.primary);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(35, 35, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner circle
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(35, 35, 28, 0, Math.PI * 2);
        ctx.fill();
        
        // "C" letter stylized
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('C', 35, 37);
        
        // ClassGo text
        ctx.fillStyle = this.colors.textDark;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('ClassGo', 80, 20);
        
        ctx.fillStyle = this.colors.gray;
        ctx.font = '11px Arial';
        ctx.fillText('Plataforma Educativa', 80, 42);
        
        ctx.restore();
    }

    drawMicrosoftLogo(ctx, x, y, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const size = 18;
        const gap = 3;
        
        // Microsoft squares
        const colors = ['#F25022', '#7FBA00', '#00A4EF', '#FFB900'];
        const positions = [
            { x: 0, y: 0 },
            { x: size + gap, y: 0 },
            { x: 0, y: size + gap },
            { x: size + gap, y: size + gap }
        ];
        
        positions.forEach((pos, i) => {
            ctx.fillStyle = colors[i];
            ctx.fillRect(pos.x, pos.y, size, size);
        });
        
        // Microsoft text
        ctx.fillStyle = '#737373';
        ctx.font = '600 16px Segoe UI, Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Microsoft', size * 2 + gap + 12, size + gap/2 + 4);
        
        // "Certified Partner" text
        ctx.fillStyle = '#a0a0a0';
        ctx.font = '10px Segoe UI, Arial';
        ctx.fillText('Certified Partner', size * 2 + gap + 12, size * 2 + gap + 8);
        
        ctx.restore();
    }

    drawMainContent(ctx, width, height, data) {
        const centerX = width / 2;
        let yPos = 280;

        // "Se otorga a" text
        ctx.textAlign = 'center';
        ctx.fillStyle = this.colors.gray;
        ctx.font = `16px ${this.fonts.body}`;
        ctx.fillText('Se otorga el presente certificado a', centerX, yPos);

        // Student name with elegant styling
        yPos += 55;
        ctx.fillStyle = this.colors.textDark;
        ctx.font = `bold 38px ${this.fonts.title}`;
        ctx.fillText(data.studentName, centerX, yPos);

        // Decorative line under name
        yPos += 15;
        ctx.strokeStyle = this.colors.accentGold;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - 180, yPos);
        ctx.lineTo(centerX + 180, yPos);
        ctx.stroke();

        // "Por completar satisfactoriamente"
        yPos += 40;
        ctx.fillStyle = this.colors.gray;
        ctx.font = `16px ${this.fonts.body}`;
        ctx.fillText('Por completar satisfactoriamente el curso', centerX, yPos);

        // Course name
        yPos += 45;
        ctx.fillStyle = this.colors.primary;
        ctx.font = `bold 28px ${this.fonts.title}`;
        
        // Handle long course names
        const maxWidth = width - 200;
        const courseName = data.courseName;
        if (ctx.measureText(courseName).width > maxWidth) {
            ctx.font = `bold 22px ${this.fonts.title}`;
        }
        ctx.fillText(`"${courseName}"`, centerX, yPos);

        // Course details box
        yPos += 50;
        this.drawCourseDetailsBox(ctx, centerX, yPos, data);

        // Grade badge
        this.drawGradeBadge(ctx, width - 130, 320, data.grade);
    }

    drawCourseDetailsBox(ctx, centerX, yPos, data) {
        const boxWidth = 500;
        const boxHeight = 70;
        const boxX = centerX - boxWidth/2;

        // Box background
        ctx.fillStyle = 'rgba(13, 115, 119, 0.05)';
        ctx.strokeStyle = 'rgba(13, 115, 119, 0.2)';
        ctx.lineWidth = 1;
        
        this.roundRect(ctx, boxX, yPos, boxWidth, boxHeight, 10);
        ctx.fill();
        ctx.stroke();

        // Details content
        const details = [
            { label: 'Categoría', value: data.category || 'General', icon: '📚' },
            { label: 'Duración', value: `${data.duration || 10} horas`, icon: '⏱️' },
            { label: 'Fecha', value: this.formatDate(data.completionDate), icon: '📅' }
        ];

        const itemWidth = boxWidth / 3;
        details.forEach((detail, index) => {
            const itemX = boxX + itemWidth * index + itemWidth/2;
            const itemY = yPos + boxHeight/2;

            ctx.textAlign = 'center';
            
            // Icon
            ctx.font = '18px Arial';
            ctx.fillText(detail.icon, itemX, itemY - 10);
            
            // Value
            ctx.fillStyle = this.colors.textDark;
            ctx.font = `bold 13px ${this.fonts.body}`;
            ctx.fillText(detail.value, itemX, itemY + 10);
            
            // Label
            ctx.fillStyle = this.colors.gray;
            ctx.font = `11px ${this.fonts.body}`;
            ctx.fillText(detail.label, itemX, itemY + 25);
        });
    }

    drawGradeBadge(ctx, x, y, grade) {
        const radius = 50;
        
        // Determine badge color based on grade
        let badgeColor, badgeText;
        if (grade >= 9) {
            badgeColor = '#10b981'; // Green - Excellent
            badgeText = 'EXCELENTE';
        } else if (grade >= 7) {
            badgeColor = '#3b82f6'; // Blue - Good
            badgeText = 'MUY BIEN';
        } else if (grade >= 6) {
            badgeColor = '#f59e0b'; // Yellow - Pass
            badgeText = 'APROBADO';
        } else {
            badgeColor = '#ef4444'; // Red - Needs improvement
            badgeText = 'COMPLETADO';
        }

        // Badge circle with gradient
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, badgeColor);
        gradient.addColorStop(1, this.darkenColor(badgeColor, 20));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner ring
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius - 8, 0, Math.PI * 2);
        ctx.stroke();

        // Grade number
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 32px ${this.fonts.body}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(grade.toFixed(1), x, y - 5);

        // "/ 10" text
        ctx.font = `14px ${this.fonts.body}`;
        ctx.fillText('/ 10', x, y + 20);

        // Badge text below
        ctx.fillStyle = badgeColor;
        ctx.font = `bold 10px ${this.fonts.body}`;
        ctx.fillText(badgeText, x, y + radius + 15);
    }

    drawFooter(ctx, width, height, data) {
        const footerY = height - 170;
        const signatureWidth = 200;
        const signatureY = footerY + 50;

        // Signature lines
        const signatures = [
            { x: 180, label: 'Director de ClassGo', name: 'ClassGo Education' },
            { x: width / 2, label: 'Tutor del Curso', name: data.tutorName || 'Instructor' },
            { x: width - 180, label: 'Microsoft Partner', name: 'Microsoft Education' }
        ];

        signatures.forEach(sig => {
            // Signature line
            ctx.strokeStyle = this.colors.gray;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sig.x - signatureWidth/2, signatureY);
            ctx.lineTo(sig.x + signatureWidth/2, signatureY);
            ctx.stroke();

            // Name
            ctx.fillStyle = this.colors.textDark;
            ctx.font = `bold 14px ${this.fonts.body}`;
            ctx.textAlign = 'center';
            ctx.fillText(sig.name, sig.x, signatureY + 20);

            // Label
            ctx.fillStyle = this.colors.gray;
            ctx.font = `12px ${this.fonts.body}`;
            ctx.fillText(sig.label, sig.x, signatureY + 38);
        });

        // Certificate ID
        const idY = height - 55;
        ctx.fillStyle = this.colors.gray;
        ctx.font = `11px ${this.fonts.body}`;
        ctx.textAlign = 'center';
        ctx.fillText(`Certificado ID: ${data.certificateId}`, width / 2, idY);
        
        // Verification URL
        ctx.font = `10px ${this.fonts.body}`;
        ctx.fillText('Verificar en: classgo-app.onrender.com/verify/' + data.certificateId, width / 2, idY + 15);
    }

    drawDecorativeElements(ctx, width, height) {
        // Top decorative flourish
        ctx.strokeStyle = 'rgba(13, 115, 119, 0.15)';
        ctx.lineWidth = 1;
        
        // Left flourish
        ctx.beginPath();
        ctx.moveTo(50, 120);
        ctx.quadraticCurveTo(100, 100, 150, 120);
        ctx.quadraticCurveTo(200, 140, 250, 120);
        ctx.stroke();

        // Right flourish
        ctx.beginPath();
        ctx.moveTo(width - 50, 120);
        ctx.quadraticCurveTo(width - 100, 100, width - 150, 120);
        ctx.quadraticCurveTo(width - 200, 140, width - 250, 120);
        ctx.stroke();

        // Side decorations
        this.drawSideDecoration(ctx, 50, height/2 - 100, 'left');
        this.drawSideDecoration(ctx, width - 50, height/2 - 100, 'right');
    }

    drawSideDecoration(ctx, x, y, side) {
        ctx.save();
        ctx.translate(x, y);
        if (side === 'right') ctx.scale(-1, 1);

        ctx.fillStyle = 'rgba(13, 115, 119, 0.08)';
        
        // Decorative leaf/branch pattern
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.ellipse(0, i * 40, 8, 20, Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawWatermark(ctx, width, height, data) {
        ctx.save();
        
        // Subtle diagonal watermark
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-Math.PI / 6);
        
        ctx.fillStyle = 'rgba(13, 115, 119, 0.03)';
        ctx.font = `bold 80px ${this.fonts.body}`;
        ctx.textAlign = 'center';
        ctx.fillText('CLASSGO', 0, 0);
        
        ctx.restore();
    }

    // === UTILITY FUNCTIONS ===

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + 
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    formatDate(dateString) {
        if (!dateString) return new Date().toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    generateCertificateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `CG-${timestamp}-${random}`.toUpperCase();
    }

    async createPDFFromCanvas(canvas, data) {
        // For browsers without jsPDF, we create a high-quality image
        // The image can be converted to PDF using print dialog
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png', 1.0);
        });
    }

    /**
     * Download certificate as PNG image
     */
    downloadAsImage(canvas, data) {
        const link = document.createElement('a');
        link.download = `Certificado_${data.courseName.replace(/\s+/g, '_')}_${data.studentName.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
    }

    /**
     * Open print dialog for PDF generation
     */
    printCertificate(canvas) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Certificado ClassGo</title>
                <style>
                    * { margin: 0; padding: 0; }
                    body { 
                        display: flex; 
                        justify-content: center; 
                        align-items: center;
                        min-height: 100vh;
                        background: #f0f0f0;
                    }
                    img { 
                        max-width: 100%; 
                        height: auto;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    }
                    @media print {
                        body { background: white; }
                        img { 
                            width: 100%;
                            box-shadow: none;
                        }
                    }
                </style>
            </head>
            <body>
                <img src="${canvas.toDataURL('image/png', 1.0)}" alt="Certificado ClassGo">
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
}

// =============================================================
// 🎯 CERTIFICATE MODAL UI
// =============================================================

class CertificateModal {
    constructor() {
        this.generator = new CertificateGenerator();
        this.modal = null;
        this.currentCertificate = null;
        this.createModal();
    }

    createModal() {
        // Remove existing modal if any
        const existing = document.getElementById('certificateModal');
        if (existing) existing.remove();

        const modalHTML = `
            <div id="certificateModal" class="certificate-modal" style="display: none;">
                <div class="certificate-modal-backdrop"></div>
                <div class="certificate-modal-content">
                    <div class="certificate-modal-header">
                        <h2>🎓 Tu Certificado</h2>
                        <button class="certificate-modal-close" onclick="certificateModal.close()">×</button>
                    </div>
                    <div class="certificate-modal-body">
                        <div class="certificate-preview" id="certificatePreview">
                            <div class="certificate-loading">
                                <div class="certificate-spinner"></div>
                                <p>Generando tu certificado...</p>
                            </div>
                        </div>
                    </div>
                    <div class="certificate-modal-footer">
                        <button class="cert-btn cert-btn-secondary" onclick="certificateModal.close()">
                            Cerrar
                        </button>
                        <button class="cert-btn cert-btn-primary" onclick="certificateModal.downloadImage()">
                            📥 Descargar Imagen
                        </button>
                        <button class="cert-btn cert-btn-success" onclick="certificateModal.printPDF()">
                            🖨️ Imprimir / PDF
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('certificateModal');
        
        // Add styles
        this.addStyles();
        
        // Close on backdrop click
        this.modal.querySelector('.certificate-modal-backdrop').addEventListener('click', () => this.close());
    }

    addStyles() {
        if (document.getElementById('certificateStyles')) return;

        const styles = `
            <style id="certificateStyles">
                .certificate-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 100000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .certificate-modal-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                }

                .certificate-modal-content {
                    position: relative;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 20px;
                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(45, 212, 191, 0.3);
                    max-width: 95vw;
                    max-height: 95vh;
                    overflow: hidden;
                    animation: certificateModalIn 0.4s ease-out;
                }

                @keyframes certificateModalIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                .certificate-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 25px;
                    border-bottom: 1px solid rgba(45, 212, 191, 0.2);
                }

                .certificate-modal-header h2 {
                    color: #fff;
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0;
                }

                .certificate-modal-close {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: #fff;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 24px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .certificate-modal-close:hover {
                    background: rgba(239, 68, 68, 0.3);
                    transform: rotate(90deg);
                }

                .certificate-modal-body {
                    padding: 25px;
                    overflow: auto;
                    max-height: calc(95vh - 180px);
                }

                .certificate-preview {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 300px;
                }

                .certificate-preview canvas,
                .certificate-preview img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                }

                .certificate-loading {
                    text-align: center;
                    color: #fff;
                }

                .certificate-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(45, 212, 191, 0.2);
                    border-top-color: #2dd4bf;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .certificate-modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 20px 25px;
                    border-top: 1px solid rgba(45, 212, 191, 0.2);
                    flex-wrap: wrap;
                }

                .cert-btn {
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .cert-btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }

                .cert-btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .cert-btn-primary {
                    background: linear-gradient(135deg, #0d7377 0%, #14919B 100%);
                    color: #fff;
                }

                .cert-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 20px rgba(13, 115, 119, 0.4);
                }

                .cert-btn-success {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: #fff;
                }

                .cert-btn-success:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 20px rgba(16, 185, 129, 0.4);
                }

                /* Course card certificate button */
                .btn-certificate {
                    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
                    color: #1a1a2e !important;
                    font-weight: 600 !important;
                }

                .btn-certificate:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 20px rgba(251, 191, 36, 0.4) !important;
                }

                @media (max-width: 768px) {
                    .certificate-modal-content {
                        width: 100%;
                        max-height: 90vh;
                        border-radius: 15px;
                    }

                    .certificate-modal-footer {
                        flex-direction: column;
                    }

                    .cert-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    async show(courseData) {
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        const preview = document.getElementById('certificatePreview');
        preview.innerHTML = `
            <div class="certificate-loading">
                <div class="certificate-spinner"></div>
                <p>Generando tu certificado...</p>
            </div>
        `;

        try {
            // Get user data
            const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const studentName = userProfile.nombre || userProfile.name || localStorage.getItem('userName') || 'Estudiante';

            // Prepare certificate data
            const certificateData = {
                studentName: studentName,
                courseName: courseData.title || courseData.name || 'Curso',
                tutorName: courseData.tutor?.name || courseData.tutorName || 'Instructor ClassGo',
                grade: courseData.bestGradeOutOf10 || courseData.bestGrade / 10 || 8.5,
                completionDate: courseData.completedAt || new Date().toISOString(),
                certificateId: this.generator.generateCertificateId(),
                duration: courseData.duration || 10,
                category: courseData.category || courseData.subject || 'Educación'
            };

            // Generate certificate
            this.currentCertificate = await this.generator.generateCertificate(certificateData);

            // Display preview
            preview.innerHTML = '';
            this.currentCertificate.canvas.style.maxWidth = '100%';
            this.currentCertificate.canvas.style.height = 'auto';
            preview.appendChild(this.currentCertificate.canvas);

        } catch (error) {
            console.error('Error generating certificate:', error);
            preview.innerHTML = `
                <div style="text-align: center; color: #ef4444;">
                    <p>❌ Error al generar el certificado</p>
                    <p style="font-size: 14px; color: #999; margin-top: 10px;">${error.message}</p>
                </div>
            `;
        }
    }

    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        this.currentCertificate = null;
    }

    downloadImage() {
        if (!this.currentCertificate?.canvas) {
            showNotification('No hay certificado para descargar', 'error');
            return;
        }

        const link = document.createElement('a');
        link.download = 'Certificado_ClassGo.png';
        link.href = this.currentCertificate.canvas.toDataURL('image/png', 1.0);
        link.click();

        showNotification('✅ Certificado descargado', 'success');
    }

    printPDF() {
        if (!this.currentCertificate?.canvas) {
            showNotification('No hay certificado para imprimir', 'error');
            return;
        }

        this.generator.printCertificate(this.currentCertificate.canvas);
    }
}

// Initialize global certificate modal
let certificateModal;

document.addEventListener('DOMContentLoaded', () => {
    certificateModal = new CertificateModal();
});

// Global function to generate certificate for a course
async function generateCourseCertificate(courseData) {
    if (!certificateModal) {
        certificateModal = new CertificateModal();
    }
    await certificateModal.show(courseData);
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.CertificateGenerator = CertificateGenerator;
    window.CertificateModal = CertificateModal;
    window.generateCourseCertificate = generateCourseCertificate;
}

console.log('🎓 Certificate Generator loaded successfully');
