import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { createIncident } from "../../api/incidents";
import { emptyFormState, IncidentForm } from "./IncidentForm";

export function NewIncidentPage() {
  const navigate = useNavigate();

  return (
    <IncidentForm
      title="تسجيل حادث"
      subtitle="املأ تفاصيل الحادث في الأقسام الثلاثة. الحفظ يتم في كل الحالات (مكتمل / غير مكتمل)"
      initial={emptyFormState()}
      submitLabel="حفظ"
      onSubmit={async (payload) => {
        try {
          const created = await createIncident({
            ...payload,
            response_minutes: null,
            duration_minutes: null,
            personnel_count: null,
            vehicles_dispatched: null,
            outcome: null,
            notes: null,
          });
          toast.success(payload.status === "مكتمل" ? "تم تسجيل الحادث (مكتمل)" : "تم الحفظ كمسودة (غير مكتمل)");
          navigate(`/incidents/${created.id}`, { replace: true });
        } catch (err) {
          toast.error(err instanceof ApiRequestError ? err.message : "تعذر التسجيل");
          throw err;
        }
      }}
    />
  );
}
