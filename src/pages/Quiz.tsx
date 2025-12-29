import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BackToHome } from "@/components/BackToHome";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useViewTracking } from "@/hooks/useViewTracking";
import { Loader2, Trophy, ArrowLeft, Home } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const monumentId = searchParams.get('monumentId');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const { trackQuizCompletion } = useViewTracking();

  useEffect(() => {
    if (monumentId) {
      generateQuiz();
    }
  }, [monumentId]);

  const generateQuiz = async () => {
    try {
      // First fetch the monument details
      const { data: monument, error: monumentError } = await supabase
        .from('monuments')
        .select('*')
        .eq('id', monumentId)
        .single();

      if (monumentError) throw monumentError;

      // Try to use stored quiz first (preferred)
      const { data: template } = await supabase
        .from('quiz_templates')
        .select('id')
        .eq('monument_id', monumentId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (template?.id) {
        const { data: storedQuestions, error: qErr } = await supabase
          .from('quiz_questions')
          .select('question, options, correct_answer, explanation, order_index')
          .eq('quiz_template_id', template.id)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true });

        if (qErr) throw qErr;

        const mapped = (storedQuestions || []).map((q: any) => ({
          question: q.question,
          options: Array.isArray(q.options) ? q.options : Array.from((q.options || [])),
          correctAnswer: q.correct_answer,
          explanation: q.explanation || '',
        }));

        if (mapped.length > 0) {
          setQuestions(mapped as Question[]);
          return; // Done: use stored quiz
        }
      }

      // Fallback: Generate quiz using edge function
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: {
          monumentText: `${monument.title}\n${monument.description}\nEra: ${monument.era}\nLocation: ${monument.location}`,
          difficulty: 'medium',
          questionCount: 5
        }
      });

      if (error) throw error;
      const qs = Array.isArray(data?.questions) ? data.questions : [];
      if (qs.length === 0) {
        throw new Error('No quiz questions returned');
      }
      setQuestions(qs);
    } catch (error: any) {
      const msg = error?.message || "Failed to generate quiz";
      setErrorMessage(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = async () => {
    const newScore = selectedAnswer === questions[currentQuestion].correctAnswer 
      ? score + 1 
      : score;
    
    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(newScore);
    }

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
      // Track quiz completion
      if (monumentId) {
        await trackQuizCompletion(monumentId, newScore, questions.length);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-24 flex flex-col justify-center items-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-heritage-terracotta mb-4" />
          <p className="text-muted-foreground">Generating quiz questions...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (errorMessage || questions.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-24">
          <Card className="max-w-2xl mx-auto p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Unable to generate quiz</h2>
            <p className="text-muted-foreground">{errorMessage || 'No questions available for this monument.'}</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={() => window.location.reload()}>Retry</Button>
              <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
              <Button variant="secondary" onClick={() => navigate('/')}>Home</Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (showResult) {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-24">
          <Card className="max-w-2xl mx-auto p-8 text-center space-y-6">
            <Trophy className="w-16 h-16 mx-auto text-heritage-gold" />
            <h2 className="text-3xl font-bold text-foreground">Quiz Complete!</h2>
            <div className="space-y-2">
              <p className="text-5xl font-bold text-heritage-terracotta">
                {score}/{questions.length}
              </p>
              <p className="text-xl text-muted-foreground">
                {percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Good job!" : "Keep learning!"}
              </p>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button onClick={() => window.location.reload()}>
                Retake Quiz
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)}>
                Back to Monument
              </Button>
              <Button variant="secondary" onClick={() => navigate("/")}>
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const question = questions[currentQuestion] as Question;
  const total = questions.length || 1;
  const progress = ((currentQuestion + 1) / total) * 100;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <div className="flex gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <BackToHome />
        </div>

        <Card className="max-w-3xl mx-auto p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>Score: {score}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">{question.question}</h2>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedAnswer === null
                      ? 'border-border hover:border-heritage-terracotta hover:bg-heritage-terracotta/5'
                      : selectedAnswer === index
                      ? index === question.correctAnswer
                        ? 'border-green-500 bg-green-50 dark:bg-green-950'
                        : 'border-red-500 bg-red-50 dark:bg-red-950'
                      : index === question.correctAnswer
                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                      : 'border-border opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === index
                        ? 'bg-heritage-terracotta border-heritage-terracotta text-white'
                        : 'border-border'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-foreground">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedAnswer !== null && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>Explanation:</strong> {question.explanation}
                </p>
              </div>
            )}

            <Button
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className="w-full"
            >
              {currentQuestion + 1 < questions.length ? 'Next Question' : 'Finish Quiz'}
            </Button>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
