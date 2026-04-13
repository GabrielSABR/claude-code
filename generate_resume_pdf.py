from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY

doc = SimpleDocTemplate(
    "Gabriel_Silva_Alves_Resume_EN.pdf",
    pagesize=A4,
    rightMargin=2.5*cm,
    leftMargin=2.5*cm,
    topMargin=2*cm,
    bottomMargin=2*cm
)

styles = getSampleStyleSheet()

name_style = ParagraphStyle(
    'Name', fontSize=22, fontName='Helvetica-Bold',
    spaceAfter=6, textColor=colors.black
)
contact_style = ParagraphStyle(
    'Contact', fontSize=10, fontName='Helvetica',
    leading=16, spaceAfter=2
)
section_style = ParagraphStyle(
    'Section', fontSize=11, fontName='Helvetica-Bold',
    spaceBefore=16, spaceAfter=2, textColor=colors.black,
    borderPad=0
)
company_style = ParagraphStyle(
    'Company', fontSize=10, fontName='Helvetica-Bold',
    spaceBefore=8, spaceAfter=1
)
date_style = ParagraphStyle(
    'Date', fontSize=10, fontName='Helvetica',
    spaceAfter=1, leftIndent=0
)
role_style = ParagraphStyle(
    'Role', fontSize=10, fontName='Helvetica-Oblique',
    spaceAfter=4
)
bullet_style = ParagraphStyle(
    'Bullet', fontSize=10, fontName='Helvetica',
    leading=14, spaceAfter=4, leftIndent=14,
    firstLineIndent=-8, alignment=TA_JUSTIFY
)
body_style = ParagraphStyle(
    'Body', fontSize=10, fontName='Helvetica',
    leading=14, spaceAfter=4, alignment=TA_JUSTIFY
)

story = []

# Name
story.append(Paragraph("Gabriel Silva Alves", name_style))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black, spaceAfter=12))

# Contact info - two columns via table
from reportlab.platypus import Table, TableStyle
contact_data = [
    ["Rua Magalhaes Correa 44 – House", "Brazilian"],
    ["Higienopolis – RJ – ZIP: 21051-510", "Single"],
    ["Phone: (21) 2230-2878", "21 years old"],
    ["Cell: (21) 99760-2888", "Email: gsa181204@gmail.com"],
]
contact_table = Table(contact_data, colWidths=[9*cm, 8*cm])
contact_table.setStyle(TableStyle([
    ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
    ('FONTSIZE', (0,0), (-1,-1), 10),
    ('LEADING', (0,0), (-1,-1), 16),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('LEFTPADDING', (0,0), (-1,-1), 0),
    ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ('TOPPADDING', (0,0), (-1,-1), 0),
]))
story.append(contact_table)
story.append(Spacer(1, 16))

# PROFESSIONAL EXPERIENCE
story.append(Paragraph("PROFESSIONAL EXPERIENCE", section_style))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black, spaceAfter=10))

story.append(Paragraph("Utequi Digital Solutions", company_style))
story.append(Paragraph("November/2022 – July/2023", date_style))
story.append(Paragraph("Web Designer Developer – WordPress (Through Elementor)", role_style))
story.append(Paragraph("• Responsible for developing institutional Pages and Websites for clients.", bullet_style))

story.append(Paragraph("Utequi Digital Solutions", company_style))
story.append(Paragraph("May/2024 – May/2025", date_style))
story.append(Paragraph(
    "• Responsible for the entire operational side of the company, including Web Development "
    "(Copywriting &gt; Design &gt; Implementation and Optimization), Traffic Management, "
    "Customer Success, Customer Support.",
    bullet_style
))

story.append(Paragraph("Dms Logistics", company_style))
story.append(Paragraph("May/2025 – August/2025", date_style))
story.append(Paragraph(
    "• Monitor import and export processes; Assist in opening registrations; Assist in customs "
    "clearance; Assist in filling out administrative forms; Assist in filling out reports, "
    "spreadsheets and documents.",
    bullet_style
))

story.append(Paragraph("Grupo Participa – with Márcio Carvalho de Sá and Elaine Montenegro", company_style))
story.append(Paragraph("October/2025 – Present", date_style))
story.append(Paragraph("Traffic Management", role_style))

bullets_participa = [
    "• Responsible for the <b>strategic management of paid traffic</b> for the leading specialist "
    "in Family Holdings in Brazil, <b>Márcio Carvalho de Sá</b>, focused on capturing qualified "
    "leads and selling courses aimed at lawyers and legal professionals.",

    "• Creation, analysis and optimization of campaigns on the main paid media channels "
    "<b>(Meta Ads and Google Ads)</b>, using <b>full funnel strategies (from brand awareness "
    "to conversion)</b>.",

    "• Campaign management for <b>group students and partners</b>, supporting lawyers in "
    "structuring client acquisition strategies and digital authority.",

    "• Acting as a <b>paid traffic instructor</b>, delivering practical classes to beginner "
    "students of the Family Holdings course who wish to learn how to manage their own ads.",

    "• Development of personalized traffic and remarketing strategies for <b>law firms</b>, "
    "focused on performance, lead generation and authority building.",
]
for b in bullets_participa:
    story.append(Paragraph(b, bullet_style))

# ACADEMIC BACKGROUND
story.append(Paragraph("ACADEMIC BACKGROUND", section_style))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black, spaceAfter=10))
story.append(Paragraph(
    "Currently enrolled in the 7th Semester of Business Administration – "
    "Veiga de Almeida University – UVA – RJ",
    body_style
))

# COMPUTER SKILLS
story.append(Paragraph("COMPUTER SKILLS", section_style))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black, spaceAfter=10))
story.append(Paragraph("Intermediate proficiency in Word, Excel and Canva;", body_style))
story.append(Paragraph(
    "Advanced proficiency in Internet, Windows 10, Web Design, WordPress, traffic management, "
    "task delegation, ClickUp;",
    body_style
))
story.append(Paragraph(
    "I have knowledge of these tools and am capable of using them efficiently and effectively "
    "to complete tasks and achieve professional goals.",
    body_style
))

# COMPLEMENTARY COURSES
story.append(Paragraph("COMPLEMENTARY COURSES", section_style))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black, spaceAfter=10))

courses = [
    "• Paid Traffic – Sobral Traffic Community",
    "• Culture and Leadership – G4 Education",
    "• Landing Page for Launches – Othon Ciparoni",
    "• Course for self-development in the main areas of life – Guerrilha Way",
    "• How to control cash flow – Sebrae",
    "• Professional Computer Skills (Windows, Word, Excel, PowerPoint, Internet and Access) – Universo Profissional",
    "• Learning Track – Academia do Universitário",
]
for c in courses:
    story.append(Paragraph(c, bullet_style))

# PERSONAL PROFILE
story.append(Paragraph("PERSONAL PROFILE", section_style))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black, spaceAfter=10))
story.append(Paragraph(
    "Responsible, creative, focused, good communication skills, punctual, proactive and "
    "multitasking, with ease in learning and adapting to various areas.",
    body_style
))

doc.build(story)
print("PDF generated successfully.")
