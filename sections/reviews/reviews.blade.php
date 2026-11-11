{{-- kit section: reviews. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-reviews" data-background="{{ $content['background'] }}">
  <div class="kit-container">
    <div class="kit-section-head"@if($variant === 'centred') data-align="centre"@endif>
      <div class="kit-section-head-text">
        @if($content['eyebrow'])
        <p class="kit-section-head-eyebrow">{{ $content['eyebrow'] }}</p>
        @endif
        <{{ kit_heading($content['heading_level']) }} class="kit-section-head-title">{{ kit_rich($content['title']) }}</{{ kit_heading($content['heading_level']) }}>
        @if($content['lede'])
        <p class="kit-section-head-lede">{{ kit_rich($content['lede']) }}</p>
        @endif
      </div>
      @if($content['link_label'] && $content['link_url'])
      <a class="kit-link" data-variant="arrow" href="{{ kit_url($content['link_url']) }}">{{ $content['link_label'] }}</a>
      @endif
    </div>
    <ul class="kit-grid kit-reviews-grid" data-cols="{{ $content['columns'] }}" data-min="sm" role="list">
      @foreach($content['reviews'] as $review)
      <li class="kit-card kit-review-card">
        <figure>
          <p class="kit-review-stars" data-rating="{{ $review['rating'] }}">{{ kit_icon('star') }}{{ kit_icon('star') }}{{ kit_icon('star') }}{{ kit_icon('star') }}{{ kit_icon('star') }}<span class="kit-vh">Rated {{ $review['rating'] }} out of 5</span></p>
          <blockquote class="kit-review-quote">{{ kit_paragraphs($review['quote']) }}</blockquote>
          <figcaption class="kit-review-who">
            <span class="kit-review-avatar" aria-hidden="true">{{ kit_initials($review['name']) }}</span>
            <span><span class="kit-review-name">{{ $review['name'] }}</span>@if($review['detail'])<span class="kit-review-detail">{{ $review['detail'] }}</span>@endif</span>
          </figcaption>
        </figure>
      </li>
      @endforeach
    </ul>
  </div>
</section>
