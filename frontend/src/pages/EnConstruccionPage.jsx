import { Construction, Clock } from "lucide-react";

export default function EnConstruccionPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-24 h-24 rounded-full bg-amber-100 border-4 border-amber-300 flex items-center justify-center mb-6">
        <Construction size={48} className="text-amber-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Estamos trabajando en ello</h1>
      <p className="text-gray-500 max-w-md mx-auto">
        Este módulo estará disponible próximamente. Mientras tanto, puedes explorar las demás funcionalidades.
      </p>
      <div className="mt-6 flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
        <Clock size={16} />
        <span className="text-sm font-medium">Próximamente</span>
      </div>
    </div>
  );
}