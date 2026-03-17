const Footer = () => (
  <footer className="section-padding py-12 border-t border-border">
    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-sm font-bold tracking-tight text-foreground">AUTOVAULT</p>
      <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} AutoVault. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
