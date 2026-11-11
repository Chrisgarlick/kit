{{-- kit section: hero. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-hero" data-variant="{{ $variant }}">
  <div class="kit-container kit-hero-inner">
    <div class="kit-hero-text">
      @if($content['eyebrow'])
      <p class="kit-hero-eyebrow">{{ $content['eyebrow'] }}</p>
      @endif
      @if($content['heading_level'] === 1)
      <h1 class="kit-hero-title">{{ kit_rich($content['title']) }}</h1>
      @elseif($content['heading_level'] === 2)
      <h2 class="kit-hero-title">{{ kit_rich($content['title']) }}</h2>
      @elseif($content['heading_level'] === 3)
      <h3 class="kit-hero-title">{{ kit_rich($content['title']) }}</h3>
      @else
      <h4 class="kit-hero-title">{{ kit_rich($content['title']) }}</h4>
      @endif
      @if($content['lede'])
      <p class="kit-hero-lede">{{ $content['lede'] }}</p>
      @endif
      @if(count($content['actions']))
      <div class="kit-hero-actions">
        @foreach($content['actions'] as $action)
        <a class="kit-button" data-size="lg" data-variant="{{ $action['style'] }}" href="{{ kit_url($action['url']) }}">{{ $action['label'] }}</a>
        @endforeach
      </div>
      @endif
      @if($content['proof'])
      <p class="kit-hero-proof"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg><span>{{ kit_rich($content['proof']) }}</span></p>
      @endif
    </div>
    @if($content['image'])
    <img class="kit-hero-media" src="{{ kit_url($content['image']['src']) }}" alt="{{ $content['image']['alt'] }}" @isset($content['image']['width'])width="{{ $content['image']['width'] }}" height="{{ $content['image']['height'] ?? '' }}" @endisset fetchpriority="high">
    @else
    <div class="kit-hero-media" data-empty><svg aria-hidden="true" viewBox="0 0 24 24" width="36" height="36"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg></div>
    @endif
  </div>
</section>
