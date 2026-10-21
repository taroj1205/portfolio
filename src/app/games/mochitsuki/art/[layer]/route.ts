import { cardDoc, cardLayers, isCardLayer } from "../../_lib/card";

export const dynamicParams = false;

export const generateStaticParams = () =>
  cardLayers.map((layer) => ({ layer }));

export const GET = async (
  _request: Request,
  { params }: RouteContext<"/games/mochitsuki/art/[layer]">
) => {
  const { layer } = await params;
  if (!isCardLayer(layer)) {
    return new Response(null, { status: 404 });
  }
  return new Response(cardDoc(layer), {
    headers: { "Content-Type": "image/svg+xml" },
  });
};
