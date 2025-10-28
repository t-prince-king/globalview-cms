import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-muted mt-16 py-8 border-t">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-serif font-bold text-xl mb-4">
              GlobalView Times
            </h3>
            <p className="text-sm text-muted-foreground">
              Your trusted source for global news and insights.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-accent transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-accent transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-accent transition-colors">
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/category/world"
                  className="hover:text-accent transition-colors"
                >
                  World
                </Link>
              </li>
              <li>
                <Link
                  to="/category/politics"
                  className="hover:text-accent transition-colors"
                >
                  Politics
                </Link>
              </li>
              <li>
                <Link
                  to="/category/technology"
                  className="hover:text-accent transition-colors"
                >
                  Technology
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <p className="text-sm text-muted-foreground">
              Stay connected for the latest updates
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2025 GlobalView Times. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
