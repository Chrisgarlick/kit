{{-- kit section: quote and stats. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<section class="kit-section-quote-stats" data-background="{{ $content['background'] }}">
  <div class="kit-container kit-qs-inner">
    <figure class="kit-qs-quote">
      <blockquote><p>{{ kit_rich($content['quote']) }}</p></blockquote>
      @if($content['attribution'])
      <figcaption>{{ $content['attribution'] }}</figcaption>
      @endif
    </figure>
    @if(count($content['stats']))
    <dl class="kit-qs-stats">
      @foreach($content['stats'] as $stat)
      <div class="kit-qs-stat">
        <dt>{{ $stat['label'] }}</dt>
        <dd>{{ $stat['value'] }}</dd>
      </div>
      @endforeach
    </dl>
    @endif
  </div>
</section>
