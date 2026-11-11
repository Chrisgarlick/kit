{{-- kit section: hero, collage. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-hero-collage">
  <div class="kit-container kit-collage-inner">
    <div class="kit-collage-text">
      @if($content['eyebrow'])
      <p class="kit-collage-eyebrow">{{ $content['eyebrow'] }}</p>
      @endif
      <{{ kit_heading($content['heading_level']) }} class="kit-collage-title">{{ kit_rich($content['title']) }}</{{ kit_heading($content['heading_level']) }}>
      @if($content['lede'])
      <p class="kit-collage-lede">{{ $content['lede'] }}</p>
      @endif
      @if(count($content['actions']))
      <div class="kit-collage-actions">
        @foreach($content['actions'] as $action)
        <a class="kit-button" data-size="lg" data-variant="{{ $action['style'] }}" href="{{ kit_url($action['url']) }}">{{ $action['label'] }}</a>
        @endforeach
      </div>
      @endif
    </div>
    @if(count($content['cards']))
    <ul class="kit-collage-cards" role="list">
      @foreach($content['cards'] as $i => $card)
      <li class="kit-float-card" data-kind="{{ $card['kind'] }}" data-slot="{{ $i }}">
        @if($card['kind'] === 'score')
        <svg class="kit-float-ring" viewBox="0 0 36 36" width="72" height="72" aria-hidden="true"><circle cx="18" cy="18" r="15.5" pathLength="100"/><circle cx="18" cy="18" r="15.5" pathLength="100" stroke-dasharray="{{ $card['score'] ?? 0 }} 100"/></svg>
        <div class="kit-float-score">
          <p class="kit-float-number">{{ $card['score'] ?? 0 }}<span class="kit-vh"> out of 100</span></p>
          <div>
            @if($card['label'])
            <p class="kit-float-title">{{ $card['label'] }}</p>
            @endif
            @if($card['text'])
            <p class="kit-float-text">{{ $card['text'] }}</p>
            @endif
          </div>
        </div>
        @elseif($card['kind'] === 'photo')
        @if($card['image'])
        <img class="kit-float-photo" src="{{ kit_url($card['image']['src']) }}" alt="{{ $card['image']['alt'] }}" @isset($card['image']['width'])width="{{ $card['image']['width'] }}" height="{{ $card['image']['height'] ?? '' }}" @endisset loading="lazy">
        @else
        <div class="kit-float-photo" data-empty>{{ kit_icon('image') }}</div>
        @endif
        @if($card['label'])
        <p class="kit-float-text">{{ $card['label'] }}</p>
        @endif
        @else
        @if($card['label'])
        <p class="kit-float-label">{{ $card['label'] }}</p>
        @endif
        @if($card['value'])
        <p class="{{ $card['kind'] === 'note' ? 'kit-float-title' : 'kit-float-value' }}">{{ $card['value'] }}</p>
        @endif
        @if($card['text'])
        <p class="kit-float-text">{{ $card['text'] }}</p>
        @endif
        @endif
      </li>
      @endforeach
    </ul>
    @endif
  </div>
</section>
