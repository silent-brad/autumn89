export interface WalkerPopover extends HTMLDivElement {
  dataset: DOMStringMap & {
    walkerId?: string;
    walkerName?: string;
    walkerAvatar?: string;
    walkerMiles?: string;
    walkerPct?: string;
    loaded?: string;
    init?: string;
  };
}
