{{-- kit section: process. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-process" data-background="{{ $content['background'] }}">
  <div class="kit-container kit-process-inner">
    <div class="kit-process-text">
      @if($content['eyebrow'])
      <p class="kit-process-eyebrow">{{ $content['eyebrow'] }}</p>
      @endif
      <{{ kit_heading($content['heading_level']) }} class="kit-process-title">{{ kit_rich($content['title']) }}</{{ kit_heading($content['heading_level']) }}>
      <ol class="kit-process-steps">
        @foreach($content['steps'] as $step)
        <li><strong>{{ $step['title'] }}{{ $content['step_punctuation'] ? '.' : '' }}</strong>@if($step['text']) {{ $step['text'] }}@endif</li>
        @endforeach
      </ol>
      @if($content['link_label'] && $content['link_url'])
      <p class="kit-process-link"><a class="kit-link" data-variant="arrow" href="{{ kit_url($content['link_url']) }}">{{ $content['link_label'] }}</a></p>
      @endif
    </div>
    @if(count($content['cards']))
    <ul class="kit-process-cards" role="list">
      @foreach($content['cards'] as $card)
      <li class="kit-note-card">
        @if($card['label'])
        <p class="kit-note-label">{{ $card['label'] }}</p>
        @endif
        <p class="kit-note-title">{{ kit_rich($card['title']) }}</p>
        @if(count($card['points']))
        <ul class="kit-note-points" role="list">
          @foreach($card['points'] as $point)
          <li{{ $point['included'] ? '' : ' data-left-out' }}>{{ kit_icon($point['included'] ? 'check' : 'x') }}<span><span class="kit-vh">{{ $point['included'] ? 'Included: ' : 'Not included: ' }}</span>{{ $point['text'] }}</span></li>
          @endforeach
        </ul>
        @endif
      </li>
      @endforeach
    </ul>
    @endif
  </div>
</section>
