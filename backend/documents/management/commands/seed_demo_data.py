import os
from pathlib import Path
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from accounts.models import User
from documents.models import Document
from documents.services.ingestion import DocumentIngestionPipeline
from faqs.models import FAQ

class Command(BaseCommand):
    help = 'Seeds initial synthetic demonstration institutional documents, FAQs, and accounts.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Initializing G38 Demonstration Seed Data..."))

        # 1. Create Demo Administrator
        admin_user, created_admin = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@college.edu',
                'first_name': 'Institutional',
                'last_name': 'Administrator',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'department': 'Academic Affairs'
            }
        )
        if created_admin:
            admin_user.set_password('AdminPass123!')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("Created demo admin: admin@college.edu / AdminPass123!"))
        else:
            self.stdout.write("Admin user already exists.")

        # 2. Create Demo Student
        student_user, created_student = User.objects.get_or_create(
            username='student',
            defaults={
                'email': 'student@college.edu',
                'first_name': 'Aman',
                'last_name': 'Sharma',
                'role': 'student',
                'student_id': 'STU2025-0489',
                'department': 'Computer Science & Engineering',
                'interests': ['Academics', 'Examinations', 'Scholarships']
            }
        )
        if created_student:
            student_user.set_password('StudentPass123!')
            student_user.save()
            self.stdout.write(self.style.SUCCESS("Created demo student: student@college.edu / StudentPass123!"))
        else:
            self.stdout.write("Student user already exists.")

        # 3. Create Sample Institutional Documents (Explicitly labeled as Synthetic Demonstration Data)
        demo_docs = [
            {
                'title': "DEMO: Institutional Attendance and Leave Regulations (2025-2026)",
                'filename': "demo_attendance_policy_2025.txt",
                'category': "Attendance",
                'description': "[FICTIONAL DEMO DATA] Official attendance criteria, condonation thresholds, and medical leave guidelines.",
                'content': """INSTITUTIONAL ATTENDANCE AND LEAVE REGULATIONS (ACADEMIC YEAR 2025-2026)
[NOTE: THIS IS SYNTHETIC DEMONSTRATION CONTENT FOR TESTING G38 AI COLLEGE ASSISTANT]

SECTION 1: MINIMUM MANDATORY ATTENDANCE
1.1 All enrolled undergraduate and postgraduate students must maintain a minimum attendance of 75% in each registered course (theory and practical separately) to be eligible for end-semester final examinations.
1.2 Attendance is calculated from the official commencement date of classes up to the last instructional working day of the semester.
1.3 Biometric and digital classroom attendance registers maintained by the respective course instructor serve as the primary official record.

SECTION 2: ATTENDANCE CONDONATION AND RELAXATION CRITERIA
2.1 Condonation for Genuine Medical Grounds:
Students having attendance between 65% and 74.9% may apply for attendance condonation subject to submission of legitimate medical certificates from a recognized hospital or campus medical center.
2.2 Hospitalization and prolonged illness exceeding 7 consecutive days require counter-signature from the University Chief Medical Officer within 5 working days of return.
2.3 Co-curricular and Sports Duty Leave:
Students officially representing the institution in university-approved sports, cultural competitions, hackathons, or national conferences are granted Duty Leave (DL) up to a maximum of 10% attendance credit, provided formal prior recommendation is approved by the Head of Department.
2.4 Absolute Bar on Examination:
Under no circumstances shall any student possessing less than 65% aggregate attendance be allowed to sit for end-semester examinations, irrespective of medical reasons.

SECTION 3: CONSEQUENCES OF ATTENDANCE SHORTAGE
3.1 Students falling below 65% attendance (or below 75% without approved medical condonation) shall receive an 'NA' (Not Allowed) grade in that course.
3.2 An 'NA' grade mandates that the student re-register for the entire course during the subsequent supplementary summer semester and pay the prescribed re-registration fee of $150 per credit unit.
"""
            },
            {
                'title': "DEMO: Comprehensive Examination and Grading Framework",
                'filename': "demo_examination_guidelines.txt",
                'category': "Examinations",
                'description': "[FICTIONAL DEMO DATA] Grading scale, internal assessments, backlog policies, and reappear procedures.",
                'content': """COMPREHENSIVE EXAMINATION AND GRADING REGULATIONS
[NOTE: THIS IS SYNTHETIC DEMONSTRATION CONTENT FOR TESTING G38 AI COLLEGE ASSISTANT]

SECTION 1: ASSESSMENT ARCHITECTURE AND EVALUATION SCHEME
1.1 Continuous Internal Assessment (CIA) accounts for 40% of the total course grade. The components include:
- Two mid-term written examinations: 20%
- Quizzes, assignments, and presentations: 10%
- Laboratory practical performance / mini-project: 10%
1.2 End-Semester Examination (ESE) accounts for 60% of the total course grade and covers the complete syllabus.

SECTION 2: 10-POINT RELATIVE GRADING SYSTEM
2.1 The institution follows a 10-point Letter Grading scale:
- Grade 'O' (Outstanding): Grade Point 10.0 (Marks >= 90%)
- Grade 'A+' (Excellent): Grade Point 9.0 (Marks 80% - 89%)
- Grade 'A' (Very Good): Grade Point 8.0 (Marks 70% - 79%)
- Grade 'B+' (Good): Grade Point 7.0 (Marks 60% - 69%)
- Grade 'B' (Above Average): Grade Point 6.0 (Marks 50% - 59%)
- Grade 'C' (Pass): Grade Point 5.0 (Marks 40% - 49%)
- Grade 'F' (Fail): Grade Point 0.0 (Marks < 40%)
2.2 Minimum Passing Requirement:
A candidate must secure at least 40% marks in the End-Semester Examination and an aggregate of 40% combining CIA and ESE to qualify for course credit.

SECTION 3: BACKLOGS, REAPPEAR AND IMPROVEMENT EXAMINATIONS
3.1 Students obtaining an 'F' grade in any course may appear for the Supplementary Reappear Examination held immediately after semester break.
3.2 Maximum Reappear Attempts: A student is permitted a maximum of 3 consecutive reappear attempts per backlog course.
3.3 Fee for Reappear:
The re-examination processing fee is fixed at $35 per theoretical subject and $50 per laboratory subject.
3.4 Grade Improvement:
Students who passed a course but achieved a grade of 'C' or 'B' may apply for grade improvement in at most two courses within one year of passing.
"""
            },
            {
                'title': "DEMO: Merit and Need-Based Institutional Scholarships",
                'filename': "demo_scholarships_policy.txt",
                'category': "Scholarships",
                'description': "[FICTIONAL DEMO DATA] Scholarship eligibility brackets, renewal criteria, and required documentation.",
                'content': """INSTITUTIONAL SCHOLARSHIP AND FINANCIAL ASSISTANCE GUIDELINES
[NOTE: THIS IS SYNTHETIC DEMONSTRATION CONTENT FOR TESTING G38 AI COLLEGE ASSISTANT]

SECTION 1: MERIT SCHOLARSHIP SCHEMES
1.1 Academic Excellence Tier 1 (President's Honor Scholarship):
- 100% tuition fee waiver.
- Eligibility: Top 1% rank in national entrance test or Grade Point Average (CGPA) of 9.5 and above with zero backlogs.
1.2 Academic Excellence Tier 2 (Dean's List Scholarship):
- 50% tuition fee waiver.
- Eligibility: CGPA between 9.0 and 9.49.
1.3 Academic Excellence Tier 3:
- 25% tuition fee waiver.
- Eligibility: CGPA between 8.5 and 8.99.

SECTION 2: NEED-BASED AND SOCIAL EQUITY FINANCIAL AID
2.1 Means-cum-Merit Assistance:
Students whose verified gross family annual income from all sources is less than $4,000 per annum are eligible for up to a 60% tuition concession, provided they maintain a CGPA of at least 7.0.
2.2 Single Girl Child and Defense Ward Concessions:
A 15% tuition concession is granted to single girl children and children of defense/paramilitary personnel.

SECTION 3: MANDATORY APPLICATION PROCEDURES AND DEADLINES
3.1 Application Window:
Scholarship application forms must be submitted through the Student Services Portal between August 1 and August 31 for the Fall semester, and January 5 to January 25 for the Spring semester.
3.2 Required Verification Documents:
- Income Certificate issued by an authorized revenue magistrate (issued within the preceding 6 months).
- Grade transcripts of the preceding two consecutive semesters.
- Active bank account details (IFSC code and account verification passbook).
3.3 Revocation of Scholarship:
A scholarship is automatically revoked if a student is found guilty of disciplinary misconduct, ragging, or attendance shortage below 75%.
"""
            },
            {
                'title': "DEMO: Campus Hostel Regulations and Residential Guidelines",
                'filename': "demo_hostel_rules.txt",
                'category': "Hostel",
                'description': "[FICTIONAL DEMO DATA] Curfew timings, night-out leave procedures, guest policies, and disciplinary codes.",
                'content': """CAMPUS RESIDENTIAL HOSTEL REGULATIONS AND CODE OF CONDUCT
[NOTE: THIS IS SYNTHETIC DEMONSTRATION CONTENT FOR TESTING G38 AI COLLEGE ASSISTANT]

SECTION 1: CURFEW TIMINGS AND BIOMETRIC CHECK-IN
1.1 All resident students must check into their respective hostel blocks by 9:30 PM on weekdays (Monday through Friday) and by 10:30 PM on weekends (Saturday and Sunday).
1.2 Biometric turnstile verification at the hostel gate closes strictly at curfew. Late arrivals are registered in the security logbook.
1.3 Three unexcused late arrivals in a calendar month will incur a formal warning and notification to parents/guardians.

SECTION 2: NIGHT-OUT LEAVE PROCEDURE
2.1 Residents seeking overnight leave to visit local guardians or family must submit a Night-Out Application via the Student Portal at least 24 hours in advance.
2.2 The parent or registered local guardian must confirm approval via the automated SMS/portal verification system before the warden issues a digital gate pass.
2.3 Unapproved absence overnight is treated as a major disciplinary violation with a mandatory fine of $50.

SECTION 3: ROOM ALLOTMENT, APPLIANCES, AND SAFETY
3.1 Prohibited Electrical Equipment:
Use of high-power heating appliances (immersion rods, induction plates, room heaters) is strictly forbidden inside residential rooms due to fire safety regulations.
3.2 Visitors and Day Scholars:
Day scholars and outside guests are not permitted to enter hostel residential corridors or stay overnight under any circumstances. Visitors may only be met in the designated Central Visitor Lounge between 4:00 PM and 7:00 PM.
3.3 Quiet Hours:
Mandatory quiet hours are observed from 11:00 PM to 6:00 AM to facilitate academic study and rest.
"""
            }
        ]

        for item in demo_docs:
            doc, doc_created = Document.objects.get_or_create(
                title=item['title'],
                defaults={
                    'category': item['category'],
                    'description': item['description'],
                    'uploaded_by': admin_user,
                    'visibility': 'published',
                    'original_filename': item['filename'],
                    'document_status': 'uploaded'
                }
            )

            if doc_created or not doc.stored_file:
                doc.stored_file.save(item['filename'], ContentFile(item['content'].encode('utf-8')))
                doc.save()

            self.stdout.write(f"Ingesting document: {doc.title}...")
            success = DocumentIngestionPipeline.process_document(str(doc.id))
            if success:
                self.stdout.write(self.style.SUCCESS(f"-> Indexed: {doc.title} ({doc.chunk_count} chunks)"))
            else:
                self.stdout.write(self.style.ERROR(f"-> Failed to index: {doc.title}"))

        # 4. Create Initial Verified FAQs
        faqs_data = [
            {
                'question': "What is the minimum attendance required to appear for examinations?",
                'answer': "A student must maintain a minimum attendance of 75% in each course (theory and practical separately). Students with 65% to 74.9% may apply for medical condonation with valid hospital documentation. Students below 65% receive an 'NA' grade.",
                'category': "Attendance"
            },
            {
                'question': "How many marks are required to pass a course?",
                'answer': "Students must secure at least 40% marks in the End-Semester Examination and an aggregate of at least 40% combining Continuous Internal Assessment (40%) and End-Semester Examination (60%).",
                'category': "Examinations"
            },
            {
                'question': "What is the deadline for applying for semester scholarships?",
                'answer': "Scholarship applications must be submitted via the Student Portal between August 1 and August 31 for the Fall semester, and between January 5 and January 25 for the Spring semester.",
                'category': "Scholarships"
            },
            {
                'question': "What are the hostel curfew timings?",
                'answer': "Hostel check-in is strictly 9:30 PM on weekdays (Monday-Friday) and 10:30 PM on weekends (Saturday-Sunday).",
                'category': "Hostel"
            }
        ]

        for f_data in faqs_data:
            FAQ.objects.get_or_create(
                question=f_data['question'],
                defaults={
                    'answer': f_data['answer'],
                    'category': f_data['category'],
                    'created_by': admin_user,
                    'visibility': 'published'
                }
            )

        self.stdout.write(self.style.SUCCESS("G38 Demonstration Seed Data successfully initialized!"))
