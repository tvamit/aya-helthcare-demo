"""
Populate Vector Database from Hospital Knowledge
Converts hospital data to searchable vector embeddings
"""
import chromadb
from chromadb.utils import embedding_functions
import os

print("="*60)
print("🏥 APOLLO HOSPITAL - VECTOR DATABASE POPULATION")
print("="*60)

# Hospital Knowledge Base (from hospital-knowledge.ts)
HOSPITAL_DATA = {
    "hospitalInfo": {
        "name": "Apollo Multispecialty Hospital",
        "location": "Sector 26, Delhi NCR",
        "established": "1995",
        "beds": 500,
        "accreditation": "NABH & JCI Accredited",
        "emergency": "24/7 Available",
        "contactNumber": "1860-500-1066",
        "email": "info@apollohospital.com",
    },

    "departments": [
        {
            "name": "Cardiology",
            "hindiName": "हृदय रोग विभाग",
            "description": "Heart diseases, bypass surgery, angioplasty",
            "services": ["ECG", "2D Echo", "Angiography", "Bypass Surgery", "Pacemaker"],
            "floorNumber": 3,
            "opd": "Mon-Sat: 9 AM - 5 PM",
        },
        {
            "name": "Neurology",
            "hindiName": "मस्तिष्क रोग विभाग",
            "description": "Brain & nervous system disorders",
            "services": ["MRI", "CT Scan", "EEG", "Stroke Treatment", "Epilepsy Care"],
            "floorNumber": 4,
            "opd": "Mon-Sat: 9 AM - 5 PM",
        },
        {
            "name": "Orthopedics",
            "hindiName": "हड्डी रोग विभाग",
            "description": "Bone, joint and muscle problems",
            "services": ["Joint Replacement", "Fracture Treatment", "Arthroscopy", "Spine Surgery"],
            "floorNumber": 2,
            "opd": "Mon-Sat: 10 AM - 6 PM",
        },
        {
            "name": "Pediatrics",
            "hindiName": "बाल रोग विभाग",
            "description": "Child healthcare up to 18 years",
            "services": ["Vaccination", "Growth Monitoring", "NICU", "Child Surgery"],
            "floorNumber": 1,
            "opd": "Mon-Sat: 8 AM - 6 PM, Sun: 9 AM - 1 PM",
        },
        {
            "name": "Gynecology & Obstetrics",
            "hindiName": "प्रसूति एवं स्त्री रोग",
            "description": "Women's health, pregnancy & delivery",
            "services": ["Normal Delivery", "C-Section", "High-Risk Pregnancy", "IVF", "Gynec Surgery"],
            "floorNumber": 5,
            "opd": "Mon-Sat: 9 AM - 5 PM",
        },
        {
            "name": "Gastroenterology",
            "hindiName": "पाचन तंत्र विभाग",
            "description": "Stomach, liver, intestine problems",
            "services": ["Endoscopy", "Colonoscopy", "Liver Treatment", "Gastric Surgery"],
            "floorNumber": 3,
            "opd": "Mon-Fri: 10 AM - 4 PM",
        },
        {
            "name": "Pulmonology",
            "hindiName": "फेफड़ों के रोग विभाग",
            "description": "Lung & respiratory diseases",
            "services": ["Asthma Treatment", "TB Care", "Sleep Study", "Bronchoscopy"],
            "floorNumber": 4,
            "opd": "Mon-Sat: 9 AM - 5 PM",
        },
        {
            "name": "Nephrology",
            "hindiName": "गुर्दे रोग विभाग",
            "description": "Kidney diseases & dialysis",
            "services": ["Dialysis", "Kidney Transplant", "Stone Treatment"],
            "floorNumber": 2,
            "opd": "Mon-Sat: 9 AM - 5 PM",
        },
        {
            "name": "Emergency & Trauma",
            "hindiName": "आपातकालीन विभाग",
            "description": "24/7 Emergency services",
            "services": ["Accident Care", "Trauma Surgery", "Critical Care", "Ambulance Service"],
            "floorNumber": "Ground Floor",
            "opd": "24/7",
        },
    ],

    "doctors": [
        {
            "name": "Dr. Rajesh Kumar",
            "specialization": "Cardiologist",
            "experience": "25 years",
            "qualifications": "MBBS, MD, DM (Cardiology)",
            "consultationFee": 1500,
            "timings": "Mon, Wed, Fri: 10 AM - 2 PM",
        },
        {
            "name": "Dr. Priya Sharma",
            "specialization": "Gynecologist",
            "experience": "18 years",
            "qualifications": "MBBS, MS (OBG)",
            "consultationFee": 1200,
            "timings": "Mon-Sat: 9 AM - 5 PM",
        },
        {
            "name": "Dr. Amit Patel",
            "specialization": "Orthopedic Surgeon",
            "experience": "20 years",
            "qualifications": "MBBS, MS (Ortho)",
            "consultationFee": 1000,
            "timings": "Tue, Thu, Sat: 11 AM - 5 PM",
        },
        {
            "name": "Dr. Sneha Reddy",
            "specialization": "Pediatrician",
            "experience": "15 years",
            "qualifications": "MBBS, MD (Pediatrics)",
            "consultationFee": 800,
            "timings": "Mon-Sat: 8 AM - 2 PM",
        },
        {
            "name": "Dr. Vikram Singh",
            "specialization": "Neurologist",
            "experience": "22 years",
            "qualifications": "MBBS, MD, DM (Neurology)",
            "consultationFee": 1500,
            "timings": "Mon, Wed, Fri: 2 PM - 6 PM",
        },
    ],
}

def create_knowledge_sentences():
    """Convert hospital data to searchable sentences"""
    sentences = []

    # Hospital Info
    info = HOSPITAL_DATA['hospitalInfo']
    sentences.extend([
        f"{info['name']} {info['location']} me hai.",
        f"Apollo Hospital Sector 26 Delhi NCR me located hai.",
        f"Hospital ka contact number {info['contactNumber']} hai.",
        f"Email: {info['email']}",
        f"Hospital me total {info['beds']} beds hai.",
        f"Hospital {info['accreditation']} hai.",
        f"Emergency services {info['emergency']}",
        f"Apollo Hospital 1995 me establish hua tha.",
    ])

    # Departments
    for dept in HOSPITAL_DATA['departments']:
        sentences.extend([
            f"{dept['name']} department {dept['floorNumber']} floor par hai.",
            f"{dept['hindiName']} {dept['floorNumber']} floor par hai.",
            f"{dept['name']} department me {dept['description']}",
            f"{dept['name']} OPD timing: {dept['opd']}",
            f"{dept['name']} me ye services available hai: {', '.join(dept['services'])}",
        ])

        # Add Hindi queries
        if dept['name'] == 'Cardiology':
            sentences.extend([
                "Heart doctor Cardiology department me milenge.",
                "Dil ka doctor cardiologist hai 3rd floor par.",
                "Hriday rog specialist cardiology me hai.",
            ])
        elif dept['name'] == 'Pediatrics':
            sentences.extend([
                "Baccho ke doctor pediatrics department me hai.",
                "Child specialist 1st floor par hai.",
                "Bacho ka doctor pediatrician hai.",
            ])
        elif dept['name'] == 'Orthopedics':
            sentences.extend([
                "Haddi ka doctor orthopedics me hai.",
                "Bone specialist 2nd floor par hai.",
                "Joint problem ke liye orthopedics jao.",
            ])

    # Doctors
    for doc in HOSPITAL_DATA['doctors']:
        sentences.extend([
            f"Dr. {doc['name']} {doc['specialization']} hai.",
            f"Dr. {doc['name']} ki consultation fees {doc['consultationFee']} rupees hai.",
            f"Dr. {doc['name']} ka experience {doc['experience']} hai.",
            f"Dr. {doc['name']} available hai: {doc['timings']}",
            f"Dr. {doc['name']} ke qualifications: {doc['qualifications']}",
        ])

    # Medical Symptoms & Guidance
    symptoms_guidance = [
        # Chest Pain
        "Chest pain ho to turant emergency me jao. Heart attack ho sakta hai.",
        "Seene me dard ho to immediately emergency department jao.",
        "Chest pain agar severe ho to dial 1860-500-1066.",
        "Heart attack symptoms: chest pain, sweating, breathlessness.",

        # Fever
        "3 din se zyada fever ho to doctor ko dikhao.",
        "Bukhar agar 3 days se zyada ho to general physician se milein.",
        "High fever with headache ho to neurology check karao.",

        # Breathing
        "Sans lene me problem ho to turant emergency jao.",
        "Breathing difficulty pulmonology department me dikhao.",
        "Asthma patients pulmonology 4th floor par jaye.",

        # Stomach
        "Pet dard severe ho to gastroenterology department jao.",
        "Stomach pain agar vomiting ke saath ho to emergency jao.",
        "Pait dard gastroenterology 3rd floor par dikhao.",

        # General
        "Emergency kisi bhi waqt aa sakte hai, 24/7 open hai.",
        "Accident hone par turant emergency dial karo.",
    ]
    sentences.extend(symptoms_guidance)

    # Services
    services = [
        "Pharmacy 24/7 open rehti hai ground floor par.",
        "Dawakhana ground floor par hai, 24 ghante khuli rehti hai.",
        "Lab services 24/7 available hai.",
        "Blood test same day report mil jata hai.",
        "X-ray report 2 hours me mil jati hai.",
        "MRI aur CT scan next day report milta hai.",
        "Ambulance service 24/7 available. Call 1860-500-1066 press 1.",
        "Blood bank basement me hai, 24/7 available.",
    ]
    sentences.extend(services)

    # Booking & Admission
    booking_info = [
        "Appointment book karne ke liye 1860-500-1066 par call karo.",
        "Online appointment www.apollohospital.com/book-appointment se book karo.",
        "Admission ke liye doctor consultation jaruri hai.",
        "Hospital admit hone ke liye Aadhar card lao.",
        "Insurance cashless facility available hai.",
        "Star Health, ICICI Lombard, HDFC Ergo insurance accept karte hai.",
    ]
    sentences.extend(booking_info)

    return sentences

def populate_vector_db():
    """Create and populate ChromaDB with hospital knowledge"""

    # Step 1: Create sentences
    print("\n📝 Converting hospital data to sentences...")
    sentences = create_knowledge_sentences()
    print(f"✅ Created {len(sentences)} knowledge sentences")

    # Step 2: Initialize ChromaDB
    print("\n🔧 Initializing ChromaDB...")
    db_path = os.path.join(os.path.dirname(__file__), "chroma_db")
    client = chromadb.PersistentClient(path=db_path)

    # Step 3: Create embedding function
    print("🧠 Loading embedding model (all-MiniLM-L6-v2)...")
    embedder = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"  # 384-dimensional, fast, FREE
    )

    # Step 4: Create or get collection
    print("📦 Creating collection...")
    try:
        client.delete_collection("hospital_knowledge")
        print("   (Deleted old collection)")
    except:
        pass

    collection = client.create_collection(
        name="hospital_knowledge",
        embedding_function=embedder,
        metadata={"description": "Apollo Hospital comprehensive knowledge base"}
    )

    # Step 5: Add documents
    print("\n🚀 Adding documents to vector database...")
    ids = [f"doc_{i}" for i in range(len(sentences))]

    # Add in batches (ChromaDB works better with batches)
    batch_size = 100
    for i in range(0, len(sentences), batch_size):
        batch_sentences = sentences[i:i+batch_size]
        batch_ids = ids[i:i+batch_size]
        collection.add(
            documents=batch_sentences,
            ids=batch_ids
        )
        print(f"   Added batch {i//batch_size + 1} ({len(batch_sentences)} docs)")

    print(f"\n✅ Successfully populated {len(sentences)} documents!")
    print(f"📍 Database location: {db_path}")

    # Step 6: Test search
    print("\n" + "="*60)
    print("🧪 TESTING VECTOR SEARCH")
    print("="*60)

    test_queries = [
        "Heart ka doctor chahiye",
        "ICU me kitne bed hai",
        "Chest pain ho raha hai",
        "Baccho ka doctor",
        "Pharmacy kab khulti hai",
    ]

    for query in test_queries:
        print(f"\n🔍 Query: '{query}'")
        results = collection.query(
            query_texts=[query],
            n_results=3
        )
        print("   Top Results:")
        for i, doc in enumerate(results['documents'][0], 1):
            print(f"   {i}. {doc}")

    print("\n" + "="*60)
    print("✅ VECTOR DATABASE READY!")
    print("="*60)

if __name__ == "__main__":
    populate_vector_db()
