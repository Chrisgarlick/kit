<?php
// Compiled by kit from sections/reviews/reviews.blade.php. Don't edit it: change the template and run `kit section compile`.
return function ($content = [], $variant = 'default'): void {
?>

<section class="kit-section-reviews" data-background="<?php echo kit_e($content['background']); ?>">
  <div class="kit-container">
    <div class="kit-section-head"<?php if (($variant === 'centred')): ?> data-align="centre"<?php endif; ?>>
      <div class="kit-section-head-text">
        <?php if ($content['eyebrow']): ?>
        <p class="kit-section-head-eyebrow"><?php echo kit_e($content['eyebrow']); ?></p>
        <?php endif; ?>
        <<?php echo kit_e(kit_heading($content['heading_level'])); ?> class="kit-section-head-title"><?php echo kit_e(kit_rich($content['title'])); ?></<?php echo kit_e(kit_heading($content['heading_level'])); ?>>
        <?php if ($content['lede']): ?>
        <p class="kit-section-head-lede"><?php echo kit_e(kit_rich($content['lede'])); ?></p>
        <?php endif; ?>
      </div>
      <?php if (($content['link_label'] && $content['link_url'])): ?>
      <a class="kit-link" data-variant="arrow" href="<?php echo kit_e(kit_url($content['link_url'])); ?>"><?php echo kit_e($content['link_label']); ?></a>
      <?php endif; ?>
    </div>
    <ul class="kit-grid kit-reviews-grid" data-cols="<?php echo kit_e($content['columns']); ?>" data-min="sm" role="list">
      <?php foreach ($content['reviews'] as $review): ?>
      <li class="kit-card kit-review-card">
        <figure>
          <p class="kit-review-stars" data-rating="<?php echo kit_e($review['rating']); ?>"><?php echo kit_e(kit_icon('star')); ?><?php echo kit_e(kit_icon('star')); ?><?php echo kit_e(kit_icon('star')); ?><?php echo kit_e(kit_icon('star')); ?><?php echo kit_e(kit_icon('star')); ?><span class="kit-vh">Rated <?php echo kit_e($review['rating']); ?> out of 5</span></p>
          <blockquote class="kit-review-quote"><?php echo kit_e(kit_paragraphs($review['quote'])); ?></blockquote>
          <figcaption class="kit-review-who">
            <span class="kit-review-avatar" aria-hidden="true"><?php echo kit_e(kit_initials($review['name'])); ?></span>
            <span><span class="kit-review-name"><?php echo kit_e($review['name']); ?></span><?php if ($review['detail']): ?><span class="kit-review-detail"><?php echo kit_e($review['detail']); ?></span><?php endif; ?></span>
          </figcaption>
        </figure>
      </li>
      <?php endforeach; ?>
    </ul>
  </div>
</section>
<?php
};
