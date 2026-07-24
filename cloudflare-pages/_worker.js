import application from "./index.js";

const STATIC_FILE_PATTERN =
  /\.(?:css|gif|ico|jpe?g|js|json|png|svg|webp|woff2?)$/i;

export default {
  async fetch(request, environment, context) {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const sourcePath = url.searchParams.get("url");
      if (sourcePath?.startsWith("/") && !sourcePath.startsWith("//")) {
        return environment.ASSETS.fetch(new Request(new URL(sourcePath, url)));
      }
    }

    if (
      url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/_vinext_fonts/") ||
      STATIC_FILE_PATTERN.test(url.pathname)
    ) {
      return environment.ASSETS.fetch(request);
    }

    return application.fetch(request, environment, context);
  },
};
