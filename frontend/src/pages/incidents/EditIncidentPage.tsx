import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiRequestError } from "../../api/client";
import { getIncident, updateIncident } from "../../api/incidents";
import { Loader } from "../../components/Loader";
import { emptyFormState, IncidentForm, stateFromIncident } from "./IncidentForm";
import type { IncidentFormState } from "./IncidentForm";

export function EditIncidentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<IncidentFormState | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getIncident(Number(id))
      .then((inc) => {
        if (!active) return;
        setInitial(stateFromIncident(inc));
      })
      .catch((err) => {
        toast.error(err instanceof ApiRequestError ? err.message : "تعذر تحميل الحادث");
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (!id) return null;
  if (!initial) return <Loader fullPage />;

  return (
    <IncidentForm
      title="تعديل حادث"
      subtitle="عدّل الحقول الناقصة وسيتغيّر الحالة تلقائياً عند اكتمالها"
      initial={initial ?? emptyFormState()}
      submitLabel="حفظ التعديلات"
      onSubmit={async (payload) => {
        try {
          await updateIncident(Number(id), payload);
          toast.success(payload.status === "مكتمل" ? "تم الحفظ — الحادث مكتمل" : "تم الحفظ — لا يزال غير مكتمل");
          navigate(`/incidents/${id}`, { replace: true });
        } catch (err) {
          toast.error(err instanceof ApiRequestError ? err.message : "تعذر الحفظ");
          throw err;
        }
      }}
    />
  );
}
