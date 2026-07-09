import json
import qrcode
import os

STUDENTS = [
    ("STU-00001", "Aarav", "Sharma"),
    ("STU-00002", "Gita", "Adhikari"),
    ("STU-00003", "Suman", "Thapa"),
    ("STU-00004", "Rita", "Gurung"),
    ("STU-00005", "Krishna", "Poudel"),
]

output_dir = os.path.dirname(os.path.abspath(__file__))
print(f"{'Student ID':<20} {'Name':<30} {'PNG File'}")
print("-" * 80)

for student_id, first_name, last_name in STUDENTS:
    name = f"{first_name} {last_name}"
    safe_name = name.replace(" ", "_").lower()
    filename = f"{student_id}_{safe_name}.png"
    filepath = os.path.join(output_dir, filename)

    qr_content = json.dumps({"version": 1, "studentId": student_id}, separators=(",", ":"))
    img = qrcode.make(qr_content)
    img.save(filepath)

    print(f"{student_id:<20} {name:<30} {filename}")

print(f"\nGenerated {len(STUDENTS)} QR codes in: {output_dir}")
