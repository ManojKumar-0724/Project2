import { Scan, Github, Twitter, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-heritage-earth text-heritage-cream py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-heritage-terracotta to-heritage-gold flex items-center justify-center">
                <Scan className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">AR Folk</span>
            </div>
            <p className="text-heritage-cream/70 text-sm">
              Reviving cultural heritage through immersive AR storytelling and community engagement.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#monuments" className="text-heritage-cream/70 hover:text-heritage-gold transition-colors">Monuments</a></li>
              <li><a href="#stories" className="text-heritage-cream/70 hover:text-heritage-gold transition-colors">Stories</a></li>
              <li><a href="#quizzes" className="text-heritage-cream/70 hover:text-heritage-gold transition-colors">Quizzes</a></li>
              <li><a href="#contribute" className="text-heritage-cream/70 hover:text-heritage-gold transition-colors">Contribute</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-heritage-cream/70 hover:text-heritage-gold transition-colors">Documentation</a></li>
              <li><a href="#" className="text-heritage-cream/70 hover:text-heritage-gold transition-colors">API Access</a></li>
              <li><a href="#" className="text-heritage-cream/70 hover:text-heritage-gold transition-colors">Community Guidelines</a></li>
              <li><a href="#" className="text-heritage-cream/70 hover:text-heritage-gold transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-bold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-lg bg-heritage-cream/10 hover:bg-heritage-gold/20 flex items-center justify-center transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-heritage-cream/10 hover:bg-heritage-gold/20 flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-heritage-cream/10 hover:bg-heritage-gold/20 flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
            <p className="text-heritage-cream/70 text-sm mt-4">
              PES University<br />
              Department of Computer Applications<br />
              Capstone Project 2025-26
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-heritage-cream/20 text-center text-sm text-heritage-cream/70">
          <p>© 2025 AR Folk Storytelling. Built with ❤️ for cultural preservation.</p>
          <p className="mt-2">Presented by: Manoj Kumar P (PES1PG24CA268) | Guided by: Ms. Rajani S</p>
        </div>
      </div>
    </footer>
  );
};
