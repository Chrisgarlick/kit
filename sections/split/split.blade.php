{{-- kit section: split. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-split" data-background="{{ $content['background'] }}" data-media="{{ $content['media'] }}"{{ $content['swap'] ? ' data-swap' : '' }}>
  <div class="kit-container kit-split-inner">
    <div class="kit-text-block kit-split-text">
      @if($content['eyebrow'])
      <p class="kit-text-block-eyebrow">{{ $content['eyebrow'] }}</p>
      @endif
      <{{ kit_heading($content['heading_level']) }} class="kit-text-block-title">{{ kit_rich($content['title']) }}</{{ kit_heading($content['heading_level']) }}>
      @if($content['body'])
      <div class="kit-text-block-body">{{ kit_paragraphs($content['body']) }}</div>
      @endif
      @if(count($content['points']))
      <ul class="kit-text-block-points" role="list">
        @foreach($content['points'] as $point)
        <li>{{ $point['text'] }}</li>
        @endforeach
      </ul>
      @endif
      @if($content['link_label'] && $content['link_url'])
      <p class="kit-text-block-actions"><a class="kit-link" data-variant="arrow" href="{{ kit_url($content['link_url']) }}">{{ $content['link_label'] }}</a></p>
      @endif
    </div>
    @if($content['media'] === 'questions')
    <div class="kit-split-questions">
      @foreach($content['questions'] as $i => $item)
      <details class="kit-accordion"{{ $i === 0 ? ' open' : '' }}>
@if($content['numbered'])
        <summary><span class="kit-split-number" aria-hidden="true">{{ ($i === 9 || $i === 10 || $i === 11) ? '' : '0' }}{{ $i + 1 }}</span><span class="kit-split-question">{{ $item['question'] }}</span></summary>
@else
        <summary>{{ $item['question'] }}</summary>
@endif
        <div class="kit-accordion-body">{{ kit_paragraphs($item['answer']) }}</div>
      </details>
      @endforeach
    </div>
    @elseif($content['image'])
    <img class="kit-split-media" src="{{ kit_url($content['image']['src']) }}" alt="{{ $content['image']['alt'] }}" @isset($content['image']['width'])width="{{ $content['image']['width'] }}" height="{{ $content['image']['height'] ?? '' }}" @endisset loading="lazy">
    @else
    <div class="kit-split-media" data-empty><svg aria-hidden="true" viewBox="0 0 24 24" width="36" height="36"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg></div>
    @endif
  </div>
</section>
