{{-- kit section: header. Edit this, then run `kit section compile`. --}}
@props(['content' => [], 'variant' => 'default'])
<header class="kit-section-header"@if($content['tone'] !== 'plain') data-tone="{{ $content['tone'] }}"@endif>
  <div class="kit-container kit-header-bar">
    <a class="kit-header-brand" href="{{ kit_url($content['home_url']) }}">
      @if($content['logo'])
      <img class="kit-header-logo" src="{{ kit_url($content['logo']['src']) }}" alt="" @isset($content['logo']['width'])width="{{ $content['logo']['width'] }}" height="{{ $content['logo']['height'] ?? '' }}"@endisset>
      @else
      <span class="kit-header-mark" aria-hidden="true"></span>
      @endif
      <span class="kit-header-name">{{ $content['brand_name'] }}</span>
    </a>
    @if(count($content['links']))
    <nav class="kit-header-nav" aria-label="Main">
      <ul role="list">
        @foreach($content['links'] as $i => $link)
        <li><a href="{{ kit_url($link['url']) }}"@if($link['current']) aria-current="page"@endif>@if($content['numbered'])<span class="kit-header-num" aria-hidden="true">0{{ $i + 1 }}</span>@endif{{ $link['label'] }}</a></li>
        @endforeach
      </ul>
    </nav>
    @endif
    <div class="kit-header-end">
      @if($content['phone'])
      <a class="kit-header-phone" href="{{ kit_tel($content['phone']) }}"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg><span>{{ $content['phone'] }}</span></a>
      @endif
      @if($content['action_label'] && $content['action_url'])
      <a class="kit-button kit-header-action" data-variant="primary" href="{{ kit_url($content['action_url']) }}">{{ $content['action_label'] }}</a>
      @endif
      @if(count($content['links']))
      <details class="kit-header-menu">
        <summary class="kit-button" data-variant="ghost"><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span>Menu</span></summary>
        <nav class="kit-header-sheet" aria-label="Menu">
          <ul role="list">
            @foreach($content['links'] as $i => $link)
            <li><a href="{{ kit_url($link['url']) }}"@if($link['current']) aria-current="page"@endif>@if($content['numbered'])<span class="kit-header-num" aria-hidden="true">0{{ $i + 1 }}</span>@endif{{ $link['label'] }}</a></li>
            @endforeach
          </ul>
          @if($content['action_label'] && $content['action_url'])
          <a class="kit-button" data-variant="primary" href="{{ kit_url($content['action_url']) }}">{{ $content['action_label'] }}</a>
          @endif
        </nav>
      </details>
      @endif
    </div>
  </div>
</header>
