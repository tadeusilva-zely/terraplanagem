import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Truck, KeyRound, AlertCircle } from 'lucide-react';

export default function Login() {
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (pin.length < 4) {
      setErro('Digite o PIN completo (4 dígitos)');
      return;
    }

    const success = login(pin);
    if (!success) {
      setErro('PIN inválido ou usuário inativo');
      setPin('');
    }
  };

  const handlePinChange = (value: string) => {
    // Apenas números, máximo 4 dígitos
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setPin(cleaned);
    setErro('');
  };

  const handleNumpadClick = (num: string) => {
    if (pin.length < 4) {
      handlePinChange(pin + num);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setErro('');
  };

  const handleClear = () => {
    setPin('');
    setErro('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-amber-500 p-3 rounded-full">
              <Truck size={40} />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Terraplenagem</h1>
          <p className="text-gray-400 text-sm mt-1">Controle de Horas</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-gray-600 text-sm mb-2 text-center">
              <KeyRound className="inline mr-2" size={16} />
              Digite seu PIN
            </label>

            {/* PIN display */}
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`
                    w-12 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold
                    ${pin[i] ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}
                  `}
                >
                  {pin[i] ? '•' : ''}
                </div>
              ))}
            </div>

            {/* Error message */}
            {erro && (
              <div className="flex items-center justify-center gap-2 text-red-500 text-sm mb-4">
                <AlertCircle size={16} />
                <span>{erro}</span>
              </div>
            )}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumpadClick(num)}
                className="h-14 text-2xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-14 text-sm font-semibold bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-gray-600"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => handleNumpadClick('0')}
              className="h-14 text-2xl font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 text-sm font-semibold bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-gray-600"
            >
              ←
            </button>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={pin.length < 4}
            className={`
              w-full py-4 rounded-lg font-bold text-white transition-colors
              ${pin.length === 4
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-gray-300 cursor-not-allowed'}
            `}
          >
            Entrar
          </button>

          {/* Demo PINs */}
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>PINs de demonstração:</p>
            <p className="mt-1">
              Admin: <span className="font-mono bg-gray-100 px-1 rounded">1234</span>
              {' | '}
              Operador: <span className="font-mono bg-gray-100 px-1 rounded">1111</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
