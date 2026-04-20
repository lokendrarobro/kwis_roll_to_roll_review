export const defectStatusFilterList = [
  {
    item_value: "deleted",
    item_name: "delete"
  },
  {
    item_value: "merged",
    item_name: "merged"
  },
  {
    item_value: "spliced",
    item_name: "spliced"
  },
  {
    item_value: "repaired",
    item_name: "repaired"
  },
  {
    item_value: "suggest_for_deletion",
    item_name: "suggest_for_deletion"
  },
  {
    item_value: "suggest_for_rejection",
    item_name: "suggest_for_rejection"
  },
  {
    item_value: "na",
    item_name: "identified"
  },
  {
    item_value: 'enable',
    item_name: 'enable' 
  },
  {
    item_value: 'disable', 
    item_name: 'disable' 
  }
]


export const defaultFeatureActivityList = [
  {
    feature_id:1,
    module_id:1,
    message:`Machine id has been changed.`,
    activity:"Machine id",
    severity:1
  },
  {
    feature_id: 2,
    module_id: 1,
    message: `Filter has been applied to rolls.`,
    activity: "Apply filter on roll list",
    severity:1
  },
  {
    feature_id: 3,
    module_id: 1,
    message: `Customer roll id has been updated.`,
    activity: "Roll Id Edit",
    severity:1
  },
  {
    feature_id:4,
    module_id:1,
    message:`Note has been added or updated`,
    activity:"Add/Edit Note",
    severity:1
  },
  {
    feature_id:5,
    module_id:1,
    message:`User tag has been updated`,
    activity:"Add/Edit User Tag",
    severity:1
  },
  {
    feature_id:6,
    module_id:1,
    message:`Roll has been deleted`,
    activity:"Delete Roll (Only Admin)",
    severity:1
  },
  {
    feature_id:7,
    module_id:1,
    message:`Roll details has been viewed`,
    activity:"Roll details",
    severity:1
  },
  {
    feature_id:8,
    module_id:1,
    message:`Report Has been Exported`,
    activity:"Export Report",
    severity:1
  },
  {
    feature_id:1,
    module_id:2,
    message:`PDF has been downloaded`,
    activity:"Download Pdf",
    severity:1
  },
  {
    feature_id:2,
    module_id:2,
    message:`Note has been added or updated`,
    activity:"Add/Edit Note",
    severity:1
  },
  {
    feature_id:3,
    module_id:2,
    message:`Start review button has been clicked`,
    activity:"Start review",
    severity:1
  },
  {
    feature_id:4,
    module_id:2,
    message:`Start repair button has been clicked`,
    activity:"Start repair",
    severity:1
  },
  {
    feature_id:1,
    module_id:3,
    message:`Roll has been updated to reviewed`,
    activity:"Done button",
    severity:1
  },
  {
    feature_id:2,
    module_id:3,
    message:`Filter has been applied to defects.`,
    activity:"Apply filter on defects",
    severity:1
  },
  {
    feature_id:3,
    module_id:3,
    message:`Defects has been deleted`,
    activity:"Delete defects",
    severity:1
  },
  {
    feature_id:4,
    module_id:3,
    message:`Defects has been merged.`,
    activity:"Merge Defects",
    severity:1
  },
  {
    feature_id:5,
    module_id:3,
    message:`Defect image has been viewed`,
    activity:"Defect Img Zoom In/out",
    severity:1
  },
  {
    feature_id:6,
    module_id:3,
    message:`Roll width has been clicked`,
    activity:"Roll width",
    severity:1
  },
  {
    feature_id:7,
    module_id:3,
    message:`Load more defects has been clicked`,
    activity:"Load more defects",
    severity:1
  },
  {
    feature_id:8,
    module_id:3,
    message:`Defect type has been changed`,
    activity:"Change Defect type",
    severity:1
  },
  {
    feature_id:9,
    module_id:3,
    message:`Note has been added or updated`,
    activity:"Add/Edit Note",
    severity:1
  },
  {
    feature_id:10,
    module_id:3,
    message:`AI Suggetion has been updated`,
    activity:"Update AI Suggetion",
    severity:1
  }, 
  {
    feature_id:11,
    module_id:3,
    message:`Defect has been undeleted`,
    activity:"Undelete Defect",
    severity:1
  }, 
  {
    feature_id:12,
    module_id:3,
    message:`Splice has been added`,
    activity:"Add Splice Details",
    severity:1
  },
  {
    feature_id:1,
    module_id:4,
    message:`Filter has been applied to roll width page.`,
    activity:"Apply filter on roll width",
    severity:1
  },
  {
    feature_id:2,
    module_id:4,
    message:`Graph width has been enabled.`,
    activity:"View Graph",
    severity:1
  },
  {
    feature_id:3,
    module_id:4,
    message:`Image width has been enabled.`,
    activity:"View Image",
    severity:1
  },
  {
    feature_id:4,
    module_id:4,
    message:`Show only variation points enabled`,
    activity:"Show only Variation points",
    severity:1
  },
  {
    feature_id:5,
    module_id:4,
    message:`Add as defect has been clicked`,
    activity:"Add Defect",
    severity:1
  },
  {
    feature_id:1,
    module_id:5,
    message:`Filter has been applied to AI agents`,
    activity:"Apply filter on AI agents",
    severity:1
  },
  {
    feature_id:2,
    module_id:5,
    message:`AI Model has been added`,
    activity:"Add model",
    severity:1
  },
  {
    feature_id:3,
    module_id:5,
    message:`AI model has been deleted`,
    activity:"Delete Model",
    severity:1
  },
  {
    feature_id:4,
    module_id:5,
    message:`Train button has been clicked.`,
    activity:"Train",
    severity:1
  },
  {
    feature_id:1,
    module_id:6,
    message:`Defect has been spliced.`,
    activity:"Splice Defect",
    severity:1
  },
  {
    feature_id:2,
    module_id:6,
    message:`Defect has been repaired.`,
    activity:"Repair Defect",
    severity:1
  },
  {
    feature_id:3,
    module_id:6,
    message:`Suggetion for delete defect has been checked`,
    activity:"Suggetion for delete Defect",
    severity:1
  },
  {
    feature_id:4,
    module_id:6,
    message:`Roll has been repaired.`,
    activity:"Done button",
    severity:1
  },
  {
    feature_id:5,
    module_id:6,
    message:`Roll running status has been changed`,
    activity:"Roll running status(start & stop)",
    severity:1
  },
  {
    feature_id:1,
    module_id:7,
    message:`Custom user tag has been added`,
    activity:"Add custom user tag",
    severity:1
  },
  {
    feature_id:2,
    module_id:7,
    message:`Custom user tag has been updated`,
    activity:"Edit custom user tag",
    severity:1
  },
  {
    feature_id:3,
    module_id:7,
    message:`User tag has been deleted`,
    activity:"Delete custom user tag",
    severity:1
  },
  {
    feature_id:4,
    module_id:7,
    message:`Module visibility has been updated`,
    activity:"module visiblity",
    severity:1
  },
  {
    feature_id:5,
    module_id:7,
    message:`New pdf generation config has been added`,
    activity:"Add pdf generation config",
    severity:1
  },
  {
    feature_id:6,
    module_id:7,
    message:`Pdf generation config has been edited`,
    activity:"Edit pdf generation config",
    severity:1
  },
  {
    feature_id:7,
    module_id:7,
    message:`Pdf generation config has been deleted`,
    activity:"Delete pdf generation config",
    severity:1
  },
  {
    feature_id:8,
    module_id:7,
    message:`New quality code config has been added`,
    activity:"Add quality code config",
    severity:1
  },
  {
    feature_id:9,
    module_id:7,
    message:`Quality code config has been edited`,
    activity:"Edit quality code config",
    severity:1
  },
  {
    feature_id:10,
    module_id:7,
    message:`Quality code config has been deleted`,
    activity:"Delete quality code config",
    severity:1
  },
  {
    feature_id:11,
    module_id:7,
    message:`New repair machine config has been added`,
    activity:"Add repair machine config",
    severity:1
  },
  {
    feature_id:12,
    module_id:7,
    message:`Repair machine config has been edited`,
    activity:"Edit repair machine config",
    severity:1
  },
  {
    feature_id:13,
    module_id:7,
    message:`Repair machine config has been deleted`,
    activity:"Delete repair machine config",
    severity:1
  },
  {
    feature_id:14,
    module_id:7,
    message:`New Inspection machine config has been added`,
    activity:"Add inspection machine config",
    severity:1
  },
  {
    feature_id:15,
    module_id:7,
    message:`Inspection machine config has been edited`,
    activity:"Edit inspection machine config",
    severity:1
  },
  {
    feature_id:16,
    module_id:7,
    message:`Inspection machine config has been deleted`,
    activity:"Delete inspection machine config",
    severity:1
  },
  {
    feature_id:17,
    module_id:7,
    message:`New Production Report config has been added`,
    activity:"Add production report config",
    severity:1
  },
  {
    feature_id:18,
    module_id:7,
    message:`Production Report config has been edited`,
    activity:"Edit production report config",
    severity:1
  },
  {
    feature_id:19,
    module_id:7,
    message:`Production Report config has been deleted`,
    activity:"Delete production report config",
    severity:1
  },
]

export const Colors = [
    { colour_name: "Royal Blue", colour_code: "#4169E1" },
    { colour_name: "Turquoise", colour_code: "#40E0D0" },
    { colour_name: "Crimson", colour_code: "#DC143C" },
    { colour_name: "Deep Sky Blue", colour_code: "#00BFFF" },
    { colour_name: "Hot Pink", colour_code: "#FF69B4" },
    { colour_name: "Coral Red", colour_code: "#FF4040" },
    { colour_name: "Slate Blue", colour_code: "#6A5ACD" },
    { colour_name: "Sea Green", colour_code: "#2E8B57" },
    { colour_name: "Teal Blue", colour_code: "#367588" },
    { colour_name: "Medium Crimson", colour_code: "#B22222" },
    { colour_name: "Persian Green", colour_code: "#009B77" },
    { colour_name: "Raspberry", colour_code: "#E30B5D" },
    { colour_name: "Verdigris", colour_code: "#43B3AE" },
    { colour_name: "Denim", colour_code: "#1560BD" },
    { colour_name: "Orange Red", colour_code: "#FF4500" },
    { colour_name: "Bittersweet", colour_code: "#FE6F5E" },
    { colour_name: "Amaranth", colour_code: "#E52B50" },
    { colour_name: "Cerulean", colour_code: "#007BA7" },
    { colour_name: "Mulberry", colour_code: "#C54B8C" },
    { colour_name: "Electric Purple", colour_code: "#BF00FF" },
    { colour_name: "Vivid Tangerine", colour_code: "#FFA089" },
    { colour_name: "Maximum Blue", colour_code: "#47ABCC" },
    { colour_name: "Blue Jeans", colour_code: "#5DADEC" },
    { colour_name: "Majorelle Blue", colour_code: "#6050DC" },
    { colour_name: "Medium Persian Blue", colour_code: "#0067A5" },
    { colour_name: "Jungle Green", colour_code: "#29AB87" },
    { colour_name: "Medium Ruby", colour_code: "#AA4069" },
    { colour_name: "Bright Maroon", colour_code: "#C32148" },
    { colour_name: "Scarlet", colour_code: "#FF2400" },
    { colour_name: "Dark Tangerine", colour_code: "#FFA62B" },
    { colour_name: "Tangerine", colour_code: "#F28500" },
    { colour_name: "Vermilion", colour_code: "#E34234" },
    { colour_name: "Deep Peach", colour_code: "#FFCBA4" },
    { colour_name: "Steel Teal", colour_code: "#5F8A8B" },
    { colour_name: "Bright Lilac", colour_code: "#D891EF" },
    { colour_name: "French Raspberry", colour_code: "#C72C48" },
    { colour_name: "Rosewood", colour_code: "#65000B" },
    { colour_name: "Electric Blue", colour_code: "#7DF9FF" },
    { colour_name: "Paradise Pink", colour_code: "#E63E62" },
    { colour_name: "Warm Red", colour_code: "#F9423A" },
    { colour_name: "Dark Coral", colour_code: "#CD5B45" },
    { colour_name: "Mango", colour_code: "#FFC324" },
    { colour_name: "Carrot Orange", colour_code: "#ED9121" },
    { colour_name: "Royal Purple", colour_code: "#7851A9" },
    { colour_name: "Medium Violet", colour_code: "#9F00C5" },
    { colour_name: "Indigo", colour_code: "#4B0082" },
    { colour_name: "Dark Sky Blue", colour_code: "#8AB8FE" },
    { colour_name: "Shamrock Green", colour_code: "#009E60" },
    { colour_name: "Malachite", colour_code: "#0BDA51" },
    { colour_name: "Blotchy Blue", colour_code: "#6B7A9C" },
    { colour_name: "Faded Crimson", colour_code: "#A45B6A" },
    { colour_name: "Streaked Pink", colour_code: "#F3AFC0" },
    { colour_name: "Patchy Orange", colour_code: "#E69258" },
    { colour_name: "Muddled Green", colour_code: "#678D58" },
    { colour_name: "Dull Purple", colour_code: "#7A5980" },
    { colour_name: "Washed Coral", colour_code: "#FF9F9F" },
    { colour_name: "Burnt Yellow", colour_code: "#D89B00" },
    { colour_name: "Blurry Violet", colour_code: "#A88BD0" },
    { colour_name: "Dusty Teal", colour_code: "#5C8C85" },
    { colour_name: "Cracked Rose", colour_code: "#D96088" },
    { colour_name: "Scuffed Blue", colour_code: "#5E7BA0" },
    { colour_name: "Tarnished Gold", colour_code: "#D4AF37" },
    { colour_name: "Flickering Red", colour_code: "#D2383F" },
    { colour_name: "Oxidized Copper", colour_code: "#6C8C6B" },
    { colour_name: "Peeling Orange", colour_code: "#E3743D" },
    { colour_name: "Bleeding Maroon", colour_code: "#8E2730" },
    { colour_name: "Frostbitten Blue", colour_code: "#90C3D4" },
    { colour_name: "Spotted Pink", colour_code: "#F9B1C1" },
    { colour_name: "Greasy Green", colour_code: "#7F9257" },
    { colour_name: "Smudged Grey", colour_code: "#8A8D8F" },
    { colour_name: "Splotchy Lavender", colour_code: "#BCA5D3" },
    { colour_name: "Stained Lemon", colour_code: "#F7E87A" },
    { colour_name: "Uneven Azure", colour_code: "#3D7EA6" },
    { colour_name: "Rust Red", colour_code: "#B7410E" },
    { colour_name: "Flaky Peach", colour_code: "#FFBC9A" },
    { colour_name: "Streaky Cyan", colour_code: "#77CEDF" },
    { colour_name: "Tarnished Plum", colour_code: "#893B78" },
    { colour_name: "Blotchy Mint", colour_code: "#A1CDA8" },
    { colour_name: "Dingy Tangerine", colour_code: "#F1993A" },
    { colour_name: "Overexposed Pink", colour_code: "#FFC2D1" },
    { colour_name: "Underexposed Navy", colour_code: "#1C2E47" },
    { colour_name: "Grimy Yellow", colour_code: "#E6CB53" },
    { colour_name: "Fuzzy Lilac", colour_code: "#C4A1E0" },
    { colour_name: "Blurred Rose", colour_code: "#DE7399" },
    { colour_name: "Frayed Burgundy", colour_code: "#872341" },
    { colour_name: "Pale Moss", colour_code: "#B4C79C" },
    { colour_name: "Dirty Denim", colour_code: "#4E6E81" },
    { colour_name: "Rusty Orange", colour_code: "#C75127" },
    { colour_name: "Cloudy Teal", colour_code: "#85A8A6" },
    { colour_name: "Foggy Blue", colour_code: "#A6C8DC" },
    { colour_name: "Wilted Green", colour_code: "#749766" },
    { colour_name: "Stale Crimson", colour_code: "#A84550" },
    { colour_name: "Dimmed Gold", colour_code: "#B59F3B" },
    { colour_name: "Tired Purple", colour_code: "#9479B2" },
    { colour_name: "Ashen Red", colour_code: "#B05C5C" },
    { colour_name: "Hazey Indigo", colour_code: "#6C5D99" },
    { colour_name: "Muted Sky", colour_code: "#9AB5CE" },
    { colour_name: "Ghost Pink", colour_code: "#F2D3E2" }
  ];
