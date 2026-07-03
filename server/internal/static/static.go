package static

import "embed"

// Dist holds the built React SPA (populated by `npm run build` + copy, or Docker build).
//
//go:embed all:dist
var Dist embed.FS
