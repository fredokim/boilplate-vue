module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      settings: {
        chromeFlags: "--no-sandbox",
      },
      staticDistDir: "./dist",
      url: ["http://localhost:4173/", "http://localhost:4173/login"],
    },
    assert: {
      assertions: {
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:performance": ["warn", { minScore: 0.75 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./reports/lighthouse",
    },
  },
};

