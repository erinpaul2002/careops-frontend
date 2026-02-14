"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function DesignSystemTest() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Typography Test */}
        <section className="space-y-6">
          <h1 className="text-foreground">CareOps Healthcare Design System</h1>
          <h2 className="text-foreground">Professional & Trustworthy</h2>
          <h3 className="text-foreground">Typography Hierarchy</h3>
          <p className="text-muted-foreground">
            This is body text using Inter font for optimal readability in healthcare contexts.
          </p>
          <small className="text-muted-foreground">
            Small text for secondary information and metadata.
          </small>
        </section>

        {/* shadcn Button Test */}
        <section className="space-y-6">
          <h3 className="text-foreground">shadcn/ui Components</h3>
          <div className="flex flex-wrap gap-4">
            <Button>Default Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </section>

        {/* Color Palette Test */}
        <section className="space-y-6">
          <h3 className="text-foreground">Healthcare Color Palette</h3>
          <div className="grid grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="w-16 h-16 bg-primary border border-border"></div>
              <p className="text-xs text-muted-foreground">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-16 bg-secondary"></div>
              <p className="text-xs text-muted-foreground">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-16 bg-accent"></div>
              <p className="text-xs text-muted-foreground">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-16 bg-destructive"></div>
              <p className="text-xs text-muted-foreground">Error</p>
            </div>
            <div className="space-y-2">
              <div className="w-16 h-16 bg-chart-3"></div>
              <p className="text-xs text-muted-foreground">Success</p>
            </div>
          </div>
        </section>

        {/* Animation Test */}
        <section className="space-y-6">
          <h3 className="text-foreground">Motion & Animation</h3>
          <motion.div
            className="w-32 h-32 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            Hover Me
          </motion.div>
        </section>

        {/* Spacing Test */}
        <section className="space-y-6">
          <h3 className="text-foreground">Spacing Scale (8px Grid)</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 6, 8, 12, 16].map((space) => (
              <div key={space} className="flex items-center space-x-4">
                <div className={`w-${space} h-4 bg-chart-1`}></div>
                <span className="text-muted-foreground text-sm">{space * 4}px</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}