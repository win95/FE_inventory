import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksBlockCta extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_ctas';
  info: {
    description: 'Block CTA \u2014 k\u00EAu g\u1ECDi h\u00E0nh \u0111\u1ED9ng cu\u1ED1i trang.';
    displayName: 'block-cta';
  };
  attributes: {
    ctaHref: Schema.Attribute.String;
    ctaLabel: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    description: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface BlocksBlockHero extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_heroes';
  info: {
    description: 'Block Hero (trang Product/Solution).';
    displayName: 'block-hero';
  };
  attributes: {
    ctaHref: Schema.Attribute.String;
    ctaLabel: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    eyebrow: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    subtitle: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    title: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface BlocksBlockHowToPlan extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_how_to_plans';
  info: {
    description: 'Block How to plan \u2014 c\u00E1c b\u01B0\u1EDBc l\u1EADp k\u1EBF ho\u1EA1ch.';
    displayName: 'block-how-to-plan';
  };
  attributes: {
    steps: Schema.Attribute.Component<'blocks.block-how-to-plan-step', true>;
  };
}

export interface BlocksBlockHowToPlanStep extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_how_to_plan_steps';
  info: {
    description: 'M\u1ED9t b\u01B0\u1EDBc trong block How to plan.';
    displayName: 'block-how-to-plan-step';
  };
  attributes: {
    text: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    title: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface BlocksBlockLeadForm extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_lead_forms';
  info: {
    description: 'Block Lead form \u2014 nh\u00FAng form l\u1EA5y lead (LEAD-01).';
    displayName: 'block-lead-form';
  };
  attributes: {
    title: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface BlocksBlockMedia extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_media';
  info: {
    description: 'Block Media \u2014 \u1EA3nh + ch\u00FA th\u00EDch.';
    displayName: 'block-media';
  };
  attributes: {
    caption: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    file: Schema.Attribute.Media<'images'>;
  };
}

export interface BlocksBlockOpportunity extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_opportunities';
  info: {
    description: 'Block Opportunity \u2014 l\u01B0\u1EDBi c\u00E1c c\u01A1 h\u1ED9i.';
    displayName: 'block-opportunity';
  };
  attributes: {
    items: Schema.Attribute.Component<'blocks.block-opportunity-item', true>;
  };
}

export interface BlocksBlockOpportunityItem extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_opportunity_items';
  info: {
    description: 'M\u1ED9t c\u01A1 h\u1ED9i trong block Opportunity.';
    displayName: 'block-opportunity-item';
  };
  attributes: {
    text: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    title: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface BlocksBlockRichText extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_rich_texts';
  info: {
    description: 'Block Rich text \u2014 \u0111o\u1EA1n v\u0103n. Frontend map JSON rich text sang \u0111o\u1EA1n v\u0103n (xem FE 9).';
    displayName: 'block-rich-text';
  };
  attributes: {
    text: Schema.Attribute.RichText &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface BlocksBlockShowcase extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_showcases';
  info: {
    description: 'Block Showcase \u2014 case study li\u00EAn quan.';
    displayName: 'block-showcase';
  };
  attributes: {
    items: Schema.Attribute.Component<'blocks.block-showcase-item', true>;
  };
}

export interface BlocksBlockShowcaseItem extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_showcase_items';
  info: {
    description: 'M\u1ED9t case study trong block Showcase.';
    displayName: 'block-showcase-item';
  };
  attributes: {
    href: Schema.Attribute.String;
    summary: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    title: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface BlocksBlockSolutions extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_solutions';
  info: {
    description: 'Block Solutions \u2014 danh s\u00E1ch gi\u1EA3i ph\u00E1p.';
    displayName: 'block-solutions';
  };
  attributes: {
    items: Schema.Attribute.Component<'blocks.block-solutions-item', true>;
  };
}

export interface BlocksBlockSolutionsItem extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_solutions_items';
  info: {
    description: 'M\u1ED9t gi\u1EA3i ph\u00E1p trong block Solutions.';
    displayName: 'block-solutions-item';
  };
  attributes: {
    href: Schema.Attribute.String;
    name: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    summary: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface BlocksBlockStats extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_stats';
  info: {
    description: 'Block Stats \u2014 l\u01B0\u1EDBi s\u1ED1 li\u1EC7u.';
    displayName: 'block-stats';
  };
  attributes: {
    items: Schema.Attribute.Component<'blocks.block-stats-item', true>;
  };
}

export interface BlocksBlockStatsItem extends Struct.ComponentSchema {
  collectionName: 'components_blocks_block_stats_items';
  info: {
    description: 'M\u1ED9t s\u1ED1 li\u1EC7u trong block Stats.';
    displayName: 'block-stats-item';
  };
  attributes: {
    label: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    value: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface SharedEventAgendaItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_event_agenda_items';
  info: {
    description: 'M\u1ED9t m\u1EE5c trong agenda s\u1EF1 ki\u1EC7n (gi\u1EDD + ti\u00EAu \u0111\u1EC1).';
    displayName: 'event-agenda-item';
  };
  attributes: {
    time: Schema.Attribute.String;
    title: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface SharedEventSpeaker extends Struct.ComponentSchema {
  collectionName: 'components_shared_event_speakers';
  info: {
    description: 'Di\u1EC5n gi\u1EA3 / kh\u00E1ch m\u1EDDi c\u1EE7a s\u1EF1 ki\u1EC7n.';
    displayName: 'event-speaker';
  };
  attributes: {
    company: Schema.Attribute.String;
    name: Schema.Attribute.String;
    role: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface SharedHowItWorksStep extends Struct.ComponentSchema {
  collectionName: 'components_shared_how_it_works_steps';
  info: {
    description: 'M\u1ED9t b\u01B0\u1EDBc trong kh\u1ED1i How AWING Works \u1EDF trang ch\u1EE7.';
    displayName: 'How It Works Step';
  };
  attributes: {
    stepText: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    stepTitle: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: 'Tr\u01B0\u1EDDng SEO c\u01A1 b\u1EA3n d\u00F9ng chung cho Article, Case Study, Product v\u00E0 Home.';
    displayName: 'SEO';
  };
  attributes: {
    keywords: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    metaDescription: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    metaTitle: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    ogImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    description: 'Link m\u1EA1ng x\u00E3 h\u1ED9i trong Global (footer).';
    displayName: 'social-link';
  };
  attributes: {
    platform: Schema.Attribute.Enumeration<
      ['facebook', 'linkedin', 'youtube', 'zalo', 'tiktok']
    >;
    url: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'blocks.block-cta': BlocksBlockCta;
      'blocks.block-hero': BlocksBlockHero;
      'blocks.block-how-to-plan': BlocksBlockHowToPlan;
      'blocks.block-how-to-plan-step': BlocksBlockHowToPlanStep;
      'blocks.block-lead-form': BlocksBlockLeadForm;
      'blocks.block-media': BlocksBlockMedia;
      'blocks.block-opportunity': BlocksBlockOpportunity;
      'blocks.block-opportunity-item': BlocksBlockOpportunityItem;
      'blocks.block-rich-text': BlocksBlockRichText;
      'blocks.block-showcase': BlocksBlockShowcase;
      'blocks.block-showcase-item': BlocksBlockShowcaseItem;
      'blocks.block-solutions': BlocksBlockSolutions;
      'blocks.block-solutions-item': BlocksBlockSolutionsItem;
      'blocks.block-stats': BlocksBlockStats;
      'blocks.block-stats-item': BlocksBlockStatsItem;
      'shared.event-agenda-item': SharedEventAgendaItem;
      'shared.event-speaker': SharedEventSpeaker;
      'shared.how-it-works-step': SharedHowItWorksStep;
      'shared.seo': SharedSeo;
      'shared.social-link': SharedSocialLink;
    }
  }
}
