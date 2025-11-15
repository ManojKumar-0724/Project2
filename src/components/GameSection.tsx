import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Star, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const quizzes = [
  {
    title: "Vijayanagara Legends",
    difficulty: "Medium",
    questions: 10,
    points: 100,
    icon: Trophy,
    color: "from-heritage-terracotta to-heritage-gold",
  },
  {
    title: "Temple Architecture Quiz",
    difficulty: "Hard",
    questions: 15,
    points: 150,
    icon: Target,
    color: "from-heritage-indigo to-heritage-terracotta",
  },
  {
    title: "Folk Story Characters",
    difficulty: "Easy",
    questions: 8,
    points: 80,
    icon: Star,
    color: "from-heritage-gold to-heritage-indigo",
  },
];

export const GameSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-heritage-gold/10 border border-heritage-gold/30 rounded-full px-4 py-2 mb-6">
            <Trophy className="w-4 h-4 text-heritage-gold animate-glow" />
            <span className="text-sm font-medium text-foreground">Gamified Learning</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Test Your Cultural Knowledge
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Engage with interactive quizzes, treasure hunts, and challenges to deepen your understanding
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {quizzes.map((quiz, idx) => (
              <Card
                key={idx}
                className="p-6 border-0 shadow-card-soft hover:shadow-monument transition-all duration-500 group cursor-pointer bg-gradient-card"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${quiz.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
                  <quiz.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-heritage-terracotta transition-colors">
                  {quiz.title}
                </h3>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="border-heritage-gold text-heritage-terracotta">
                    {quiz.difficulty}
                  </Badge>
                  <Badge variant="outline" className="border-heritage-indigo text-heritage-indigo">
                    {quiz.questions} Questions
                  </Badge>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Earn up to</span>
                  <span className="text-lg font-bold text-heritage-gold">{quiz.points} pts</span>
                </div>

                <Button className="w-full bg-heritage-terracotta hover:bg-heritage-terracotta/90 text-heritage-cream">
                  Start Quiz
                </Button>
              </Card>
            ))}
          </div>

          {/* Achievement Showcase */}
          <Card className="p-8 border-0 shadow-monument bg-gradient-card">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-heritage-gold to-heritage-terracotta flex items-center justify-center mx-auto mb-3">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">Bronze Explorer</div>
                <div className="text-sm text-muted-foreground">Visit 5 monuments</div>
              </div>
              <div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-heritage-indigo to-heritage-gold flex items-center justify-center mx-auto mb-3">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">Silver Scholar</div>
                <div className="text-sm text-muted-foreground">Complete 10 quizzes</div>
              </div>
              <div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-heritage-terracotta to-heritage-indigo flex items-center justify-center mx-auto mb-3">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">Gold Curator</div>
                <div className="text-sm text-muted-foreground">Contribute 5 stories</div>
              </div>
              <div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-heritage-gold via-heritage-terracotta to-heritage-indigo flex items-center justify-center mx-auto mb-3 animate-glow">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">Heritage Master</div>
                <div className="text-sm text-muted-foreground">Complete all challenges</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};
