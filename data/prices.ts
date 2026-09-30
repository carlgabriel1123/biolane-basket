/**
 * THE OFFICIAL PRICE LIST — the only place prices come from.
 *
 * Copied from the team's price list (30 September 2026):
 *   price = FINAL PRICE  (what she pays; what the basket adds up)
 *   srp   = SRP          (shown crossed out when higher than the price)
 *
 * A product that is not in this list shows on the site without a price
 * ("Ask our team") and can't be added to the basket. biolane.ph still
 * supplies each product's photo, stock status and link (data/shopify-map.ts),
 * never its price.
 *
 * Rows highlighted on the team's list were taken off the site: Gentle
 * Shampoo 200ml, Pure H2O 350ml, Pure H2O refill 750ml.
 *
 * Run `npm test` after editing.
 */
export interface OfficialPrice {
  /** FINAL PRICE, in pesos. */
  price: number
  /** SRP, in pesos. */
  srp: number
}

export const officialPrices: Record<string, OfficialPrice> = {
  'cleanser-2in1-200': { srp: 535, price: 525 }, //            2 in 1 Body and Hair Cleanser 200 ml
  'cleanser-2in1-350': { srp: 625, price: 590 }, //            2 in 1 Body and Hair Cleanser 350ml
  'cleanser-2in1-750': { srp: 1050, price: 995 }, //           2 in 1 Body and Hair Cleanser 750ml
  'cleanser-2in1-refill-750': { srp: 1020, price: 970 }, //    2 in 1 Body and Hair Cleanser refill 750ml
  'gentle-shampoo-350': { srp: 615, price: 585 }, //           Gentle Shampoo 350ml
  'diaper-change-cream-100': { srp: 600, price: 570 }, //      Diaper Change Cream 100ml
  'nourishing-cream-100': { srp: 590, price: 560 }, //         Nourishing and Moisturizing Cream 100ml
  'pure-h2o-750': { srp: 1095, price: 960 }, //                Pure H2O 750ml
  'liquid-powder-100': { srp: 880, price: 835 }, //            Liquid Powder 100ml
  'stretch-marks-cream-200': { srp: 1190, price: 1130 }, //    Stretch Marks Cream 200ml
  'nursing-balm-40': { srp: 720, price: 685 }, //              Nursing Balm 40ml
  'skin-fragrance': { srp: 495, price: 470 }, //               Skin Freshening Fragrance
  'almond-oil-spray-75': { srp: 520, price: 495 }, //          Sweet Almond Oil Spray 75ml
  'cicabebe-3in1-40': { srp: 680, price: 645 }, //             Organic Cicabébé 3in1 40ml
  'arnica-gel-20': { srp: 495, price: 470 }, //                Organic Arnica Gel - 20ml
  'body-milk-350': { srp: 890, price: 845 }, //                Moisturizing Body Milk 350ml
  'styling-gel-100': { srp: 525, price: 470 }, //              Styling Gel 100ml
  'rich-soap-150': { srp: 345, price: 330 }, //                Extra Rich Soap
  'baby-powder-75': { srp: 590, price: 570 }, //               Bath Powder 70g
  'cleansing-milk-750': { srp: 1150, price: 1090 }, //         Gentle Cleansing Milk 750ml
  'topilane-cleansing-cream-350': { srp: 1050, price: 995 }, // Atopiane Soothing Cleansing Cream 350ml
  'topilane-cleansing-oil-350': { srp: 1050, price: 995 }, //  Atopiane Protective Cleansing Oil 350ml
  'topilane-body-balm-350': { srp: 1190, price: 1130 }, //     Atopiane Lipid Replenishing Body Balm 350ml
  'topilane-face-cream-50': { srp: 630, price: 595 }, //       Atopiane Emollient face cream 50ml
  'cradle-cap-shampoo-150': { srp: 620, price: 585 }, //       Cradle Cap Shampoo 150ml
  'mosquito-stick': { srp: 895, price: 880 }, //               Mosquito Stick
  sunstick: { srp: 865, price: 845 }, //                       Sunstick
  sunspray: { srp: 1850, price: 1630 }, //                     Sunspray
  suncream: { srp: 895, price: 795 }, //                       Suncream
  'cleansing-milk-wipes-72': { srp: 440, price: 425 }, //      Cleansing Milk Wipes
  'pure-h2o-wipes-72': { srp: 440, price: 425 }, //            Pure Water Wipes
}
