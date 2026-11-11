{{-- kit section: gallery. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-gallery" data-background="{{ $content['background'] }}">
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
    <ul class="kit-grid kit-gallery-grid" data-cols="{{ $content['columns'] }}" data-min="xs" role="list">
      @foreach($content['images'] as $photo)
      <li>
        <figure class="kit-gallery-item">
          @if($photo['image'])
          <img class="kit-gallery-media" src="{{ kit_url($photo['image']['src']) }}" alt="{{ $photo['image']['alt'] }}" @isset($photo['image']['width'])width="{{ $photo['image']['width'] }}" height="{{ $photo['image']['height'] ?? '' }}" @endisset loading="lazy">
          @else
          <div class="kit-gallery-media" data-empty>{{ kit_icon('image') }}</div>
          @endif
          @if($photo['caption'])
          <figcaption>{{ $photo['caption'] }}</figcaption>
          @endif
        </figure>
      </li>
      @endforeach
    </ul>
  </div>
</section>
