import Image from "next/image";
import doctorImage from "@/public/Doctors-cuate.svg";

export default function DoctorVisual() {
  return (
    <Image
      src={doctorImage}
      alt="Doctor presenting medical data"
      priority
      className="object-contain w-full h-auto max-h-[460px] drop-shadow-xl"
    />
  );
}
