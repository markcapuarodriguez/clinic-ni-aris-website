import application from "./index.js";

const STATIC_FILE_PATTERN =
  /\.(?:css|gif|ico|jpe?g|js|json|png|svg|webp|woff2?)$/i;

function fetchPublicAsset(request, environment, pathname) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = `/public${pathname}`;
  assetUrl.search = "";
  return environment.ASSETS.fetch(new Request(assetUrl, request));
}

const pagesWorker = {
  async fetch(request, environment, context) {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const sourcePath = url.searchParams.get("url");
      if (sourcePath?.startsWith("/") && !sourcePath.startsWith("//")) {
        return fetchPublicAsset(request, environment, sourcePath);
      }
    }

    if (
      url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/_vinext_fonts/") ||
      STATIC_FILE_PATTERN.test(url.pathname)
    ) {
      return fetchPublicAsset(request, environment, url.pathname);
    }

    return application.fetch(request, environment, context);
  },
};

export default pagesWorker;
