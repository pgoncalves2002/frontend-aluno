import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import ExecuteWorkoutPage from "@/pages/ExecuteWorkoutPage";
import HistoryPage from "@/pages/HistoryPage";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import MyAccountPage from "@/pages/MyAccountPage";
import PerformancePage from "@/pages/PerformancePage";
import TrainerProfilePage from "@/pages/TrainerProfilePage";
import WorkoutDetailPage from "@/pages/WorkoutDetailPage";
import { useAuthStore } from "@/stores/authStore";

export default function App() {
  const { isReady, isLoggedIn, user, hydrateFromStorage } = useAuthStore();

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  if (!isReady) {
    // Hydratation rápida — não bloqueia a UI mais que ms.
    return null;
  }

  // Só aluno acessa esse SPA. Trainer/admin caem no login com mensagem.
  const allowed = isLoggedIn && user?.is_student;

  if (!allowed) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* Rota de execução de treino — fullscreen, sem BottomNav/Header
          competindo com a UI de marcar séries. */}
      <Route
        path="/sessions/:sessionId"
        element={
          <div className="min-h-screen bg-background">
            <main className="mx-auto max-w-3xl px-4 py-4">
              <ExecuteWorkoutPage />
            </main>
          </div>
        }
      />

      {/* Restante das rotas dentro do layout padrão (Header + main + BottomNav). */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/workouts/:workoutId" element={<WorkoutDetailPage />} />
        <Route path="/desempenho" element={<PerformancePage />} />
        <Route path="/historico" element={<HistoryPage />} />
        <Route path="/personal" element={<TrainerProfilePage />} />
        <Route path="/me" element={<MyAccountPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function MainLayout() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-5">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
