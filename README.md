# Personal Research Website

A fast, accessible, and dependency-free personal website for research, selected work, writing, and collaboration.

## Personalize the content

Most content lives in one file: [`data/profile.js`](data/profile.js). Shared links and the portrait are stored under `shared`; bilingual copy is stored under `locales.en` and `locales.zh`.

Update these fields first:

1. `shared`: portrait, email, and social profiles
2. `locales.en.identity` and `locales.zh.identity`: name, role, and headline
3. `about` and `principles`
4. `focus`: research or professional areas
5. `work`: projects, publications, and writing
6. `timeline`: education and positions

The current copy presents Yutong Dong’s research, projects, education, and selected experience. Public-facing content intentionally omits private contact details and other sensitive personal information.

## Preview locally

The site has no build step. Start any static file server in the repository root, for example:

```bash
python -m http.server 4173
```

Then open <http://localhost:4173>.

## Publish with GitHub Pages

The included workflow at `.github/workflows/pages.yml` deploys the site whenever `main` is updated.

In the repository settings:

1. Open **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions**.
3. If the repository is private and your plan does not support private GitHub Pages, make it public first.

## Supabase connection

The public browser connection for the `Blue2199` project lives in [`data/supabase.js`](data/supabase.js). It contains only the project URL and a publishable key, both of which are safe for browser code. Never add a secret key or `service_role` key to this repository.

## Design notes

- Original responsive design inspired by modern editorial portfolios
- Light and dark themes with saved preference
- Keyboard-accessible navigation and reduced-motion support
- Dynamic work filters
- Semantic HTML and social metadata
- No framework, package manager, analytics, or tracking

## License

Code is available under the [MIT License](LICENSE). Replace starter copy and imagery with your own content before treating the site as a finished public profile.
