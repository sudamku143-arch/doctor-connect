import { notFound } from "next/navigation";
import { VerificationBadge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { getDoctor, listAllSpecialties, listDoctorClinics } from "@/lib/api/doctors";
import { listClinics } from "@/lib/api/clinics";
import { EditForm } from "./EditForm";
import { assignClinicAction, assignSpecialtiesAction, setVerificationStatusAction, toggleDoctorClinicActiveAction } from "../actions";
import styles from "../../shared.module.css";

export default async function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doctor, allSpecialties, assignments, allClinics] = await Promise.all([
    getDoctor(id),
    listAllSpecialties(),
    listDoctorClinics(id),
    listClinics(),
  ]);
  if (!doctor) notFound();

  const specialtyIds = new Set(doctor.specialties.map((s) => s.id));
  const assignedClinicIds = new Set(assignments.map((a) => a.clinic.id));

  const approve = setVerificationStatusAction.bind(null, id, "VERIFIED");
  const reject = setVerificationStatusAction.bind(null, id, "REJECTED");
  const suspend = setVerificationStatusAction.bind(null, id, "SUSPENDED");
  const assignSpecialties = assignSpecialtiesAction.bind(null, id);
  const assignClinic = assignClinicAction.bind(null, id);

  return (
    <>
      <header className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>{doctor.full_name}</h1>
          <p className={styles.subtitle}>{doctor.registration_number}</p>
        </div>
        <VerificationBadge status={doctor.verification_status} />
      </header>

      <Card>
        <div className={styles.actionRow}>
          <form action={approve}>
            <Button type="submit" variant="secondary">
              Approve
            </Button>
          </form>
          <form action={reject}>
            <Button type="submit" variant="danger">
              Reject
            </Button>
          </form>
          <form action={suspend}>
            <Button type="submit" variant="danger">
              Suspend
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Edit details</h2>
        <EditForm doctor={doctor} />
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Specialties</h2>
        <form action={assignSpecialties} className={styles.formGrid}>
          <div className={styles.checkboxGrid}>
            {allSpecialties.map((specialty) => (
              <label key={specialty.id} className={styles.checkboxLabel}>
                <input type="checkbox" name="specialtyIds" value={specialty.id} defaultChecked={specialtyIds.has(specialty.id)} />
                {specialty.name}
              </label>
            ))}
          </div>
          <Button type="submit" variant="secondary">
            Save Specialties
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Clinics</h2>
        {assignments.length === 0 ? (
          <p className={styles.emptyText}>Not assigned to any clinic yet.</p>
        ) : (
          assignments.map((assignment) => (
            <div key={assignment.id} className={styles.row}>
              <span className={styles.rowLabel}>
                {assignment.clinic.name} — ₹{assignment.consultation_fee}
              </span>
              <form action={toggleDoctorClinicActiveAction.bind(null, id, assignment.id, !assignment.is_active)}>
                <Button type="submit" variant="secondary">
                  {assignment.is_active ? "Deactivate" : "Reactivate"}
                </Button>
              </form>
            </div>
          ))
        )}

        <form action={assignClinic} className={styles.formGrid} style={{ marginTop: "var(--space-md)" }}>
          <select name="clinicId" className={styles.filterSelect} required defaultValue="">
            <option value="" disabled>
              Assign to a clinic…
            </option>
            {allClinics
              .filter((c) => !assignedClinicIds.has(c.id))
              .map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
          </select>
          <input type="number" name="consultationFee" placeholder="Consultation fee (₹)" min={0} className={styles.searchInput} />
          <Button type="submit" variant="secondary">
            Assign Clinic
          </Button>
        </form>
      </Card>
    </>
  );
}
