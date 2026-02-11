import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GameSection } from "@/components/GameSection";
import { QuizLeaderboard } from "@/components/QuizLeaderboard";
import { BackToHome } from "@/components/BackToHome";

const Quizzes = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <div className="container mx-auto px-4 py-4">
          <BackToHome />
        </div>
        <GameSection />
        <QuizLeaderboard />
      </main>
      <Footer />
    </div>
  );
};

export default Quizzes;